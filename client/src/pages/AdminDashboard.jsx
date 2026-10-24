/**
 * pages/AdminDashboard.jsx — Admin Management Portal (Real MongoDB Data)
 *
 * Tabs:
 * 1. Overview — Real-time system statistics & quick jumps
 * 2. Students — Student registry with standardized department & semester dropdowns
 * 3. Faculty — Faculty directory with performance analytics, category breakdown & distributions
 * 4. Award of Excellence — Cycle lifecycle management, active leaderboard, cycle closure,
 *                         and historical results archive with dedicated modal inspection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { DEPARTMENTS, SEMESTERS, FEEDBACK_FACTORS } from '../constants/academicData';

// ── Reusable Accessible Modal Component ──────────────────────────────────────
const Modal = ({ title, onClose, children, maxWidth = 680 }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box" style={{ maxWidth: `${maxWidth}px`, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Tab 1: Overview ──────────────────────────────────────────────────────────
const OverviewTab = ({ onTabChange }) => {
  const [stats, setStats] = useState(null);
  const [cycleInfo, setCycleInfo] = useState({ active: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [dashRes, cyclesRes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/nomination-cycles'),
        ]);
        setStats(dashRes.data.stats);
        const allCycles = cyclesRes.data.data || [];
        setCycleInfo({
          active: allCycles.filter(c => c.status === 'open').length,
          closed: allCycles.filter(c => c.status === 'closed').length,
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load system statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrap" role="status">
        <div className="spinner" />
        <span>Loading institutional metrics…</span>
      </div>
    );
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Registered Students', value: stats.studentCount, sub: `${stats.activeStudentCount || 0} active accounts`, icon: '👤', color: '#4f46e5' },
    { label: 'Faculty Members', value: stats.facultyCount, sub: 'in academic directory', icon: '👨‍🏫', color: '#06b6d4' },
    { label: 'Feedback Submissions', value: stats.submissionCount, sub: 'total anonymous reviews', icon: '📝', color: '#22c55e' },
    { label: 'Award Cycles', value: cycleInfo.active, sub: `${cycleInfo.closed} previous cycles archived`, icon: '🏆', color: '#f59e0b' },
  ];

  return (
    <>
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.35rem' }}>{c.icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: c.color }}>{c.value ?? '–'}</div>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.label}</div>
            <div style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem', marginTop: '.2rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '.75rem' }}>Administrative Controls</h3>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem', marginBottom: '1rem' }}>
          Quickly navigate to student management, faculty reviews, or award nomination cycles.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('students')}>Manage Students</button>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('faculty')}>Manage Faculty</button>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('awards')}>Award Cycles &amp; Leaderboards</button>
        </div>
      </div>
    </>
  );
};

// ── Tab 2: Students (Standardized Dropdowns) ──────────────────────────────────
const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    semester: '1',
    department: DEPARTMENTS[0].value,
    division: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/users')
      .then(r => setStudents(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      rollNumber: '',
      password: '',
      semester: '1',
      department: DEPARTMENTS[0].value,
      division: '',
    });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/admin/users', {
        ...form,
        semester: Number(form.semester),
      });
      const pwd = form.password;
      resetForm();
      setShowCreate(false);
      setCreatedPassword(pwd);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create student account.');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.put(`/api/admin/users/${editStudent._id}`, {
        name: form.name,
        email: form.email,
        rollNumber: form.rollNumber,
        semester: Number(form.semester),
        department: form.department,
        division: form.division,
      });
      setEditStudent(null);
      resetForm();
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update student details.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (s) => {
    if (!window.confirm(`Deactivate account for ${s.name}? They will not be able to log in.`)) return;
    try {
      await api.delete(`/api/admin/users/${s._id}`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to deactivate student.'); }
  };

  const handleReactivate = async (s) => {
    try {
      await api.put(`/api/admin/users/${s._id}/reactivate`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to reactivate student.'); }
  };

  const openEdit = (s) => {
    setForm({
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || '',
      password: '',
      semester: String(s.semester || 1),
      department: s.department || DEPARTMENTS[0].value,
      division: s.division || '',
    });
    setEditStudent(s);
    setFormError('');
  };

  return (
    <>
      {createdPassword && (
        <div className="alert alert-success" role="status">
          Student account created successfully. Initial Password (shown only once): <strong>{createdPassword}</strong>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Student Registry</h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>
              Enrolled students can log in using either their Enrollment Number or institutional email.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowCreate(true); }}>+ Add Student</button>
        </div>

        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {!loading && students.length === 0 && (
          <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>No student records found.</p>
        )}

        {!loading && students.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Enrollment No.</th><th>Email</th><th>Dept</th><th>Sem</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.rollNumber || '—'}</td>
                    <td>{s.email}</td>
                    <td>{s.department || '—'}</td>
                    <td>{s.semester ? `Semester ${s.semester}` : '—'}</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '.4rem' }} onClick={() => openEdit(s)}>Edit</button>
                      {s.isActive
                        ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(s)}>Deactivate</button>
                        : <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(s)}>Reactivate</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add Student Account" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-group">
              <label htmlFor="cs-name" className="form-label">Full Name *</label>
              <input
                id="cs-name"
                type="text"
                className="form-input"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cs-email" className="form-label">Institutional Email *</label>
              <input
                id="cs-email"
                type="email"
                className="form-input"
                placeholder="e.g. priya@uem.edu.in"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cs-roll" className="form-label">Enrollment Number *</label>
              <input
                id="cs-roll"
                type="text"
                className="form-input"
                placeholder="e.g. 12024002001569"
                value={form.rollNumber}
                onChange={e => setForm(v => ({ ...v, rollNumber: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cs-pass" className="form-label">Initial Password * (min 6 characters)</label>
              <input
                id="cs-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
                required
              />
            </div>

            {/* Standardized Department Dropdown */}
            <div className="form-group">
              <label htmlFor="cs-dept" className="form-label">Department *</label>
              <select
                id="cs-dept"
                className="form-input form-select"
                value={form.department}
                onChange={e => setForm(v => ({ ...v, department: e.target.value }))}
                required
              >
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Standardized Semester Dropdown */}
            <div className="form-group">
              <label htmlFor="cs-sem" className="form-label">Semester *</label>
              <select
                id="cs-sem"
                className="form-input form-select"
                value={form.semester}
                onChange={e => setForm(v => ({ ...v, semester: e.target.value }))}
                required
              >
                {SEMESTERS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cs-div" className="form-label">Section / Division</label>
              <input
                id="cs-div"
                type="text"
                className="form-input"
                placeholder="e.g. A"
                value={form.division}
                onChange={e => setForm(v => ({ ...v, division: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <Modal title={`Edit Student — ${editStudent.name}`} onClose={() => setEditStudent(null)}>
          <form onSubmit={handleUpdate}>
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-group">
              <label htmlFor="es-name" className="form-label">Full Name</label>
              <input
                id="es-name"
                type="text"
                className="form-input"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="es-email" className="form-label">Email</label>
              <input
                id="es-email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="es-roll" className="form-label">Enrollment Number</label>
              <input
                id="es-roll"
                type="text"
                className="form-input"
                value={form.rollNumber}
                onChange={e => setForm(v => ({ ...v, rollNumber: e.target.value }))}
                required
              />
            </div>

            {/* Standardized Department Dropdown */}
            <div className="form-group">
              <label htmlFor="es-dept" className="form-label">Department</label>
              <select
                id="es-dept"
                className="form-input form-select"
                value={form.department}
                onChange={e => setForm(v => ({ ...v, department: e.target.value }))}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Standardized Semester Dropdown */}
            <div className="form-group">
              <label htmlFor="es-sem" className="form-label">Semester</label>
              <select
                id="es-sem"
                className="form-input form-select"
                value={form.semester}
                onChange={e => setForm(v => ({ ...v, semester: e.target.value }))}
              >
                {SEMESTERS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="es-div" className="form-label">Section / Division</label>
              <input
                id="es-div"
                type="text"
                className="form-input"
                value={form.division}
                onChange={e => setForm(v => ({ ...v, division: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Tab 3: Faculty (CRUD, Analytics & Standardized Dropdowns) ─────────────────
const FacultyTab = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editFaculty, setEditFaculty] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    employeeId: '',
    department: DEPARTMENTS[0].value,
    designation: '',
    email: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/faculty/all')
      .then(r => setFaculty(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load faculty records.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({
      name: '',
      abbreviation: '',
      employeeId: '',
      department: DEPARTMENTS[0].value,
      designation: '',
      email: '',
    });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/faculty', form);
      resetForm();
      setShowCreate(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create faculty record.');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.put(`/api/faculty/${editFaculty._id}`, form);
      setEditFaculty(null);
      resetForm();
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update faculty record.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (f) => {
    if (!window.confirm(`Deactivate ${f.name}?`)) return;
    try {
      await api.delete(`/api/faculty/${f._id}`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to deactivate faculty.'); }
  };

  const handleReactivate = async (f) => {
    try {
      await api.put(`/api/faculty/${f._id}/reactivate`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to reactivate faculty.'); }
  };

  const openStats = (f) => {
    setSelectedFaculty(f);
    setStats(null);
    setStatsLoading(true);
    api.get(`/api/faculty/${f._id}/stats`)
      .then(r => setStats(r.data))
      .catch(() => setStats({ error: true }))
      .finally(() => setStatsLoading(false));
  };

  const openEdit = (f) => {
    setForm({
      name: f.name,
      abbreviation: f.abbreviation || '',
      employeeId: f.employeeId,
      department: f.department || DEPARTMENTS[0].value,
      designation: f.designation || '',
      email: f.email || '',
    });
    setEditFaculty(f);
    setFormError('');
  };

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Faculty Directory</h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>
              Click any faculty name to view anonymous feedback analytics and evaluation score distributions.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowCreate(true); }}>+ Add Faculty</button>
        </div>

        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {!loading && faculty.length === 0 && (
          <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>No faculty members added yet.</p>
        )}

        {!loading && faculty.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Abbreviation</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f._id}>
                    <td>
                      <button
                        className="btn-link"
                        style={{ textAlign: 'left', fontWeight: 600, color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => openStats(f)}
                        title="Click to view detailed feedback analytics"
                      >
                        {f.name}
                      </button>
                    </td>
                    <td>{f.abbreviation || '—'}</td>
                    <td>{f.employeeId}</td>
                    <td>{f.department}</td>
                    <td>{f.designation || '—'}</td>
                    <td>
                      <span className={`badge ${f.isActive ? 'badge-green' : 'badge-red'}`}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '.4rem' }} onClick={() => openEdit(f)}>Edit</button>
                      {f.isActive
                        ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(f)}>Deactivate</button>
                        : <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(f)}>Reactivate</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty Analytics Modal */}
      {selectedFaculty && (
        <Modal title={`Performance Analytics — ${selectedFaculty.name}`} onClose={() => setSelectedFaculty(null)} maxWidth={740}>
          {statsLoading && <div className="spinner-wrap"><div className="spinner" /> Loading feedback metrics…</div>}
          {stats?.error && <div className="alert alert-error">Failed to calculate feedback statistics.</div>}
          {stats && !stats.error && (
            <>
              <div style={{ padding: '1rem', background: 'var(--clr-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--clr-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <span style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>Department:</span> <strong>{selectedFaculty.department}</strong>
                    &nbsp;·&nbsp;
                    <span style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>Designation:</span> <strong>{selectedFaculty.designation || 'Faculty'}</strong>
                    {selectedFaculty.abbreviation && (
                      <>&nbsp;·&nbsp;<span style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>Abbr:</span> <strong>{selectedFaculty.abbreviation}</strong></>
                    )}
                  </div>
                  <div>
                    Total Submissions: <strong style={{ fontSize: '1.1rem', color: 'var(--clr-primary)' }}>{stats.responseCount}</strong>
                    {stats.overallAverage !== null && (
                      <>&nbsp;·&nbsp; Mean Rating: <strong style={{ fontSize: '1.1rem', color: 'var(--clr-primary)' }}>{stats.overallAverage} / 5.0</strong></>
                    )}
                  </div>
                </div>
              </div>

              {stats.responseCount === 0 && (
                <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                  No feedback has been submitted for this faculty member yet.
                </p>
              )}

              {stats.responseCount > 0 && (
                <>
                  {stats.responseCount < 3 && (
                    <div className="alert alert-info" style={{ fontSize: '.84rem', marginBottom: '1.25rem' }}>
                      Fewer than 3 responses have been submitted.
                    </div>
                  )}

                  <h4 style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: '.75rem' }}>Criteria Ratings &amp; Score Distributions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '1.5rem' }}>
                    {FEEDBACK_FACTORS.map(f => {
                      const avg = stats.averageScores?.[f.key];
                      const dist = stats.ratingDistributions?.[f.key] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                      const count = stats.responseCount || 1;

                      return (
                        <div key={f.key} style={{ padding: '.85rem', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{f.label}</span>
                            <span style={{ fontWeight: 700, color: 'var(--clr-primary)', fontSize: '.95rem' }}>
                              {avg !== undefined ? `${avg} / 5.0` : '—'}
                            </span>
                          </div>

                          {/* Distribution breakdown */}
                          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', fontSize: '.75rem', color: 'var(--clr-text-muted)' }}>
                            {[5, 4, 3, 2, 1].map(stars => {
                              const starCount = dist[stars] || 0;
                              const pct = Math.round((starCount / count) * 100);
                              return (
                                <div key={stars} style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.15rem' }}>
                                    <span>{stars}★</span>
                                    <span>{starCount}</span>
                                  </div>
                                  <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: stars >= 4 ? '#22c55e' : stars === 3 ? '#f59e0b' : '#ef4444' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Student Comments */}
                  {stats.comments && stats.comments.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: '.65rem' }}>Anonymous Student Assessments</h4>
                      <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        {stats.comments.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '.85rem',
                              background: '#f8fafc',
                              border: '1px solid var(--clr-border)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '.85rem',
                            }}
                          >
                            {c.overallComment && (
                              <p style={{ margin: 0, marginBottom: (c.positiveComment || c.improvementComment) ? '.4rem' : 0 }}>
                                <strong style={{ color: 'var(--clr-primary)' }}>Overall Feedback:</strong> "{c.overallComment}"
                              </p>
                            )}
                            {c.positiveComment && (
                              <p style={{ margin: 0, marginBottom: c.improvementComment ? '.35rem' : 0 }}>
                                <strong style={{ color: 'var(--clr-success)' }}>Strengths:</strong> {c.positiveComment}
                              </p>
                            )}
                            {c.improvementComment && (
                              <p style={{ margin: 0 }}>
                                <strong style={{ color: 'var(--clr-warning)' }}>Areas for Improvement:</strong> {c.improvementComment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {(showCreate || editFaculty) && (
        <Modal
          title={editFaculty ? `Edit Faculty — ${editFaculty.name}` : 'Add Faculty Member'}
          onClose={() => { setShowCreate(false); setEditFaculty(null); resetForm(); }}
        >
          <form onSubmit={editFaculty ? handleUpdate : handleCreate}>
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-group">
              <label htmlFor="cf-name" className="form-label">Full Name *</label>
              <input
                id="cf-name"
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Sourav Chakraborty"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cf-abbr" className="form-label">Faculty Abbreviation</label>
              <input
                id="cf-abbr"
                type="text"
                className="form-input"
                placeholder="e.g. Dr. AK or Dr. SKG"
                value={form.abbreviation}
                onChange={e => setForm(v => ({ ...v, abbreviation: e.target.value }))}
              />
              
            </div>

            <div className="form-group">
              <label htmlFor="cf-emp" className="form-label">Employee ID *</label>
              <input
                id="cf-emp"
                type="text"
                className="form-input"
                placeholder="e.g. EMP-1042"
                value={form.employeeId}
                onChange={e => setForm(v => ({ ...v, employeeId: e.target.value }))}
                required
              />
            </div>

            {/* Standardized Department Dropdown */}
            <div className="form-group">
              <label htmlFor="cf-dept" className="form-label">Department *</label>
              <select
                id="cf-dept"
                className="form-input form-select"
                value={form.department}
                onChange={e => setForm(v => ({ ...v, department: e.target.value }))}
                required
              >
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cf-desig" className="form-label">Designation</label>
              <input
                id="cf-desig"
                type="text"
                className="form-input"
                placeholder="e.g. Associate Professor"
                value={form.designation}
                onChange={e => setForm(v => ({ ...v, designation: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cf-email" className="form-label">Institutional Email (Optional)</label>
              <input
                id="cf-email"
                type="email"
                className="form-input"
                placeholder="e.g. sourav.c@uem.edu.in"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowCreate(false); setEditFaculty(null); resetForm(); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : (editFaculty ? 'Save Changes' : 'Add Faculty')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Tab 4: Award of Excellence (Active Leaderboards & Closed History) ─────────
const AwardsTab = ({ currentSubTab = 'cycles', onSubTabChange }) => {
  const [internalSubTab, setInternalSubTab] = useState('cycles');
  const subTab = onSubTabChange ? currentSubTab : internalSubTab;
  const setSubTab = onSubTabChange || setInternalSubTab;

  const [cycles, setCycles] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedHistoryCycle, setSelectedHistoryCycle] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLeaderboard, setHistoryLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cycle Modals
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [cycleForm, setCycleForm] = useState({ title: '', academicYear: '2024-25', status: 'closed', eligibleFaculty: [] });
  const [cycleFormError, setCycleFormError] = useState('');
  const [cycleSaving, setCycleSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load all cycles, active leaderboard, and faculty
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cyclesRes, leadRes, facRes] = await Promise.all([
        api.get('/api/nomination-cycles'),
        api.get('/api/nominations/leaderboard'),
        api.get('/api/faculty/all'),
      ]);
      setCycles(cyclesRes.data.data || []);
      setLeaderboard(leadRes.data.data || []);
      setFacultyList((facRes.data.data || []).filter(f => f.isActive));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load award cycles or nominations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Create Cycle
  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setCycleFormError('');
    setCycleSaving(true);
    try {
      await api.post('/api/nomination-cycles', cycleForm);
      setShowCreateCycle(false);
      setCycleForm({ title: '', academicYear: '2024-25', status: 'closed', eligibleFaculty: [] });
      loadData();
    } catch (err) {
      setCycleFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create nomination cycle.');
    } finally {
      setCycleSaving(false);
    }
  };

  // Update Cycle
  const handleUpdateCycle = async (e) => {
    e.preventDefault();
    setCycleFormError('');
    setCycleSaving(true);
    try {
      await api.put(`/api/nomination-cycles/${editCycle._id}`, {
        title: cycleForm.title,
        status: cycleForm.status,
        eligibleFaculty: cycleForm.eligibleFaculty,
      });
      setEditCycle(null);
      setCycleForm({ title: '', academicYear: '2024-25', status: 'closed', eligibleFaculty: [] });
      loadData();
    } catch (err) {
      setCycleFormError(err.response?.data?.message || 'Failed to update cycle.');
    } finally {
      setCycleSaving(false);
    }
  };

  // Toggle Cycle Status (Close or Open)
  const handleToggleCycleStatus = async (cycle) => {
    const nextStatus = cycle.status === 'open' ? 'closed' : 'open';
    const confirmMsg = nextStatus === 'open'
      ? `Open nomination cycle "${cycle.title}"? Students will immediately be able to nominate faculty.`
      : `Close nomination cycle "${cycle.title}"? This cycle will stop accepting new nominations and move to Previous Cycles / Cycle History.`;
    if (!window.confirm(confirmMsg)) return;

    setActionInProgress(true);
    try {
      await api.put(`/api/nomination-cycles/${cycle._id}`, { status: nextStatus });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update cycle status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Cycle (Soft-delete preserving historical nominations)
  const handleDeleteCycle = async (cycle) => {
    const confirmMsg = `Are you sure you want to delete and archive nomination cycle "${cycle.title}"? Historical nomination records will be preserved in the archive.`;
    if (!window.confirm(confirmMsg)) return;

    setActionInProgress(true);
    try {
      await api.delete(`/api/nomination-cycles/${cycle._id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete cycle.');
    } finally {
      setActionInProgress(false);
    }
  };

  // View Historical Cycle Results Modal
  const handleOpenHistoryModal = async (cycle) => {
    setSelectedHistoryCycle(cycle);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/api/nominations/leaderboard?year=${cycle.academicYear}`);
      setHistoryLeaderboard(data.data || []);
    } catch {
      setHistoryLeaderboard([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEditCycleModal = (c) => {
    setCycleForm({
      title: c.title,
      academicYear: c.academicYear,
      status: c.status,
      eligibleFaculty: (c.eligibleFaculty || []).map(f => typeof f === 'object' ? f._id : f),
    });
    setEditCycle(c);
    setCycleFormError('');
  };

  const handleFacultyCheckbox = (facId) => {
    setCycleForm(prev => {
      const exists = prev.eligibleFaculty.includes(facId);
      const updated = exists
        ? prev.eligibleFaculty.filter(id => id !== facId)
        : [...prev.eligibleFaculty, facId];
      return { ...prev, eligibleFaculty: updated };
    });
  };

  const activeCycles = cycles.filter(c => c.status === 'open' && !c.isDeleted);
  const closedCycles = cycles.filter(c => c.status === 'closed' || c.isDeleted);

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${subTab === 'cycles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('cycles')}
        >
          Nomination Cycles ({activeCycles.length} Active)
        </button>
        <button
          className={`btn btn-sm ${subTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`btn btn-sm ${subTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('history')}
        >
          Previous Cycles / Cycle History ({closedCycles.length})
        </button>
      </div>

      {loading && <div className="spinner-wrap"><div className="spinner" /> Loading…</div>}

      {/* ── Sub-tab 1: Cycles Management ─────────────────────────────── */}
      {!loading && subTab === 'cycles' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.5rem' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Active Award Nomination Cycles</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>
                Open cycles allow student nominations. Closing or deleting a cycle moves it exclusively to Previous Cycles / Cycle History.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCycleForm({ title: '', academicYear: '2024-25', status: 'closed', eligibleFaculty: facultyList.map(f => f._id) });
                setCycleFormError('');
                setShowCreateCycle(true);
              }}
            >
              + Create Award Cycle
            </button>
          </div>

          {activeCycles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🏆</div>
              <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                No active nomination cycles are currently open. Create a new cycle or reopen a previous cycle from Cycle History.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setCycleForm({ title: '', academicYear: '2024-25', status: 'open', eligibleFaculty: facultyList.map(f => f._id) });
                  setCycleFormError('');
                  setShowCreateCycle(true);
                }}
              >
                + Open New Award Cycle
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Cycle Title</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Eligible Faculty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCycles.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td>{c.academicYear}</td>
                      <td>
                        <span className="badge badge-green">
                          🟢 Open (Active)
                        </span>
                      </td>
                      <td>
                        {(c.eligibleFaculty || []).length > 0
                          ? `${(c.eligibleFaculty || []).length} faculty members`
                          : 'All Active Faculty'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '.4rem' }}
                          onClick={() => openEditCycleModal(c)}
                        >
                          Edit Cycle
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ marginRight: '.4rem' }}
                          disabled={actionInProgress}
                          onClick={() => handleToggleCycleStatus(c)}
                        >
                          Close Cycle
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--clr-danger)' }}
                          disabled={actionInProgress}
                          onClick={() => handleDeleteCycle(c)}
                        >
                          Delete Cycle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sub-tab 2: Leaderboard ─────────────────────────────────────── */}
      {!loading && subTab === 'leaderboard' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '.35rem' }}>Leaderboard</h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem', margin: 0 }}>
              Faculty members ranked by total student nominations received during the current cycle.
            </p>
            <div className="alert alert-info" style={{ marginTop: '.75rem', fontSize: '.84rem' }}>
              ℹ️ <strong>Institutional Notice:</strong> These rankings represent student nominations and do not constitute a final institutional award decision. Final award selections are determined by authorized college authorities.
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
              No nominations recorded yet for the active cycle.
            </p>
          ) : (
            leaderboard.map((item, idx) => (
              <div
                key={item.faculty?._id || idx}
                style={{
                  padding: '1.15rem',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.04)' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#64748b' : idx === 2 ? '#a78058' : '#e2e8f0',
                        color: idx <= 2 ? '#ffffff' : '#475569',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '.95rem',
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{item.faculty?.name || 'Faculty Member'}</p>
                      <p style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', margin: 0 }}>
                        {item.faculty?.department} &nbsp;·&nbsp; {item.faculty?.designation || 'Faculty'}
                        {item.faculty?.employeeId ? ` (ID: ${item.faculty.employeeId})` : ''}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-blue" style={{ fontSize: '.88rem', padding: '.35rem .75rem' }}>
                      {item.nominationCount} Nomination{item.nominationCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {item.reasons && item.reasons.length > 0 && (
                  <div style={{ marginTop: '.85rem', borderTop: '1px solid var(--clr-border)', paddingTop: '.75rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--clr-text-muted)', letterSpacing: '.05em', marginBottom: '.4rem' }}>
                      ANONYMOUS STUDENT CITATIONS &amp; REASONS:
                    </p>
                    {item.reasons.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '.85rem',
                          color: 'var(--clr-text)',
                          padding: '.4rem .6rem',
                          background: 'var(--clr-surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '.35rem',
                          fontStyle: 'italic',
                        }}
                      >
                        "{r}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Sub-tab 3: Previous Cycles / Cycle History ─────────────────── */}
      {!loading && subTab === 'history' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '.35rem' }}>Previous Cycles / Cycle History</h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem', margin: 0 }}>
              Archived and closed award cycles from previous terms. Click any cycle to inspect historical vote tallies and citations.
            </p>
          </div>

          {closedCycles.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
              No closed or archived award cycles found. When an active cycle is closed or deleted, it will move exclusively here.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Award Title</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Closed Date</th>
                    <th>Archive Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {closedCycles.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td>{c.academicYear}</td>
                      <td>
                        <span className={`badge ${c.isDeleted ? 'badge-slate' : 'badge-slate'}`}>
                          {c.isDeleted ? '📁 Archived (Deleted)' : '🔴 Closed'}
                        </span>
                      </td>
                      <td>
                        {c.closedAt
                          ? new Date(c.closedAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'Archived'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: '.4rem' }}
                          onClick={() => handleOpenHistoryModal(c)}
                        >
                          View Historical Results
                        </button>
                        {!c.isDeleted && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ marginRight: '.4rem' }}
                              disabled={actionInProgress}
                              onClick={() => handleToggleCycleStatus(c)}
                            >
                              Open Cycle
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--clr-danger)' }}
                              disabled={actionInProgress}
                              onClick={() => handleDeleteCycle(c)}
                            >
                              Delete Cycle
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Historical Cycle Results ───────────────────────────── */}
      {selectedHistoryCycle && (
        <Modal
          title={`Historical Results — ${selectedHistoryCycle.title}`}
          onClose={() => setSelectedHistoryCycle(null)}
          maxWidth={720}
        >
          <div style={{ padding: '.75rem 1rem', background: 'var(--clr-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--clr-border)' }}>
            <p style={{ margin: 0, fontSize: '.88rem' }}>
              Academic Year: <strong>{selectedHistoryCycle.academicYear}</strong>
              {selectedHistoryCycle.closedAt && (
                <>&nbsp;·&nbsp; Closed On: <strong>{new Date(selectedHistoryCycle.closedAt).toLocaleDateString()}</strong></>
              )}
            </p>
          </div>

          <div className="alert alert-info" style={{ fontSize: '.82rem', marginBottom: '1.25rem' }}>
            ℹ️ <strong>Historical Record:</strong> These results reflect student nominations submitted during this cycle and do not constitute a final institutional award decision.
          </div>

          {historyLoading && <div className="spinner-wrap"><div className="spinner" /> Loading historical rankings…</div>}

          {!historyLoading && historyLeaderboard.length === 0 && (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>
              No nominations were recorded for this cycle.
            </p>
          )}

          {!historyLoading && historyLeaderboard.map((item, idx) => (
            <div
              key={item.faculty?._id || idx}
              style={{
                padding: '1rem',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--clr-text-muted)', minWidth: '24px' }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>{item.faculty?.name || 'Faculty Member'}</p>
                    <p style={{ fontSize: '.8rem', color: 'var(--clr-text-muted)', margin: 0 }}>
                      {item.faculty?.department} &nbsp;·&nbsp; {item.faculty?.designation || 'Faculty'}
                    </p>
                  </div>
                </div>
                <span className="badge badge-blue">
                  {item.nominationCount} Nomination{item.nominationCount !== 1 ? 's' : ''}
                </span>
              </div>

              {item.reasons && item.reasons.length > 0 && (
                <div style={{ marginTop: '.65rem', borderTop: '1px solid var(--clr-border)', paddingTop: '.6rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '.75rem', color: 'var(--clr-text-muted)', marginBottom: '.3rem' }}>
                    STUDENT CITATIONS:
                  </p>
                  {item.reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: '.82rem', color: 'var(--clr-text)', fontStyle: 'italic', marginBottom: '.25rem' }}>
                      "{r}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Modal>
      )}

      {/* ── Modal: Create Cycle ──────────────────────────────────────── */}
      {showCreateCycle && (
        <Modal title="Create Award of Excellence Cycle" onClose={() => setShowCreateCycle(false)}>
          <form onSubmit={handleCreateCycle}>
            {cycleFormError && <div className="alert alert-error">{cycleFormError}</div>}

            <div className="form-group">
              <label htmlFor="cc-title" className="form-label">Award Cycle Title *</label>
              <input
                id="cc-title"
                type="text"
                className="form-input"
                placeholder="e.g. Annual Teaching Excellence Awards 2024-25"
                value={cycleForm.title}
                onChange={e => setCycleForm(v => ({ ...v, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cc-year" className="form-label">Academic Year (Format: YYYY-YY) *</label>
              <input
                id="cc-year"
                type="text"
                className="form-input"
                placeholder="2024-25"
                value={cycleForm.academicYear}
                onChange={e => setCycleForm(v => ({ ...v, academicYear: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cc-status" className="form-label">Initial Status</label>
              <select
                id="cc-status"
                className="form-input form-select"
                value={cycleForm.status}
                onChange={e => setCycleForm(v => ({ ...v, status: e.target.value }))}
              >
                <option value="closed">Closed (Set as draft / open when ready)</option>
                <option value="open">Open (Immediately accept student nominations)</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Eligible Faculty Members ({cycleForm.eligibleFaculty.length} selected)
                </label>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    onClick={() => setCycleForm(p => ({ ...p, eligibleFaculty: facultyList.map(f => f._id) }))}
                    style={{ fontSize: '.78rem' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    onClick={() => setCycleForm(p => ({ ...p, eligibleFaculty: [] }))}
                    style={{ fontSize: '.78rem' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '.5rem' }}>
                {facultyList.map(f => (
                  <label key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.25rem 0', cursor: 'pointer', fontSize: '.85rem' }}>
                    <input
                      type="checkbox"
                      checked={cycleForm.eligibleFaculty.includes(f._id)}
                      onChange={() => handleFacultyCheckbox(f._id)}
                    />
                    <span>{f.name} &nbsp;·&nbsp; <small style={{ color: 'var(--clr-text-muted)' }}>{f.department}</small></span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCycle(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={cycleSaving}>
                {cycleSaving ? 'Creating…' : 'Create Cycle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Edit Cycle ────────────────────────────────────────── */}
      {editCycle && (
        <Modal title={`Edit Cycle — ${editCycle.title}`} onClose={() => setEditCycle(null)}>
          <form onSubmit={handleUpdateCycle}>
            {cycleFormError && <div className="alert alert-error">{cycleFormError}</div>}

            <div className="form-group">
              <label htmlFor="ec-title" className="form-label">Award Title</label>
              <input
                id="ec-title"
                type="text"
                className="form-input"
                value={cycleForm.title}
                onChange={e => setCycleForm(v => ({ ...v, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ec-status" className="form-label">Status</label>
              <select
                id="ec-status"
                className="form-input form-select"
                value={cycleForm.status}
                onChange={e => setCycleForm(v => ({ ...v, status: e.target.value }))}
              >
                <option value="closed">Closed</option>
                <option value="open">Open</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Eligible Faculty Members ({cycleForm.eligibleFaculty.length} selected)
                </label>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    onClick={() => setCycleForm(p => ({ ...p, eligibleFaculty: facultyList.map(f => f._id) }))}
                    style={{ fontSize: '.78rem' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    onClick={() => setCycleForm(p => ({ ...p, eligibleFaculty: [] }))}
                    style={{ fontSize: '.78rem' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '.5rem' }}>
                {facultyList.map(f => (
                  <label key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.25rem 0', cursor: 'pointer', fontSize: '.85rem' }}>
                    <input
                      type="checkbox"
                      checked={cycleForm.eligibleFaculty.includes(f._id)}
                      onChange={() => handleFacultyCheckbox(f._id)}
                    />
                    <span>{f.name} &nbsp;·&nbsp; <small style={{ color: 'var(--clr-text-muted)' }}>{f.department}</small></span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditCycle(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={cycleSaving}>
                {cycleSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ── Root Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const sub = searchParams.get('sub') || 'cycles';

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const handleSubTabChange = (newSub) => {
    setSearchParams({ tab: 'awards', sub: newSub });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'awards', label: 'Award of Excellence' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 className="page-title">Admin Management Portal</h1>
          <p className="page-subtitle">
            Institute of Engineering and Management &amp; University of Engineering and Management
          </p>
        </div>

        {/* Tab navigation */}
        <div className="tab-bar" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab onTabChange={setTab} />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'faculty' && <FacultyTab />}
        {tab === 'awards' && <AwardsTab currentSubTab={sub} onSubTabChange={handleSubTabChange} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
