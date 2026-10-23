/**
 * pages/AdminDashboard.jsx — Admin Dashboard (Real MongoDB Data)
 *
 * Tabs:
 * 1. Overview — Aggregated statistics & quick jump actions
 * 2. Students — Student accounts CRUD & activation control
 * 3. Faculty — Faculty members CRUD, activation, and feedback performance stats
 * 4. Award of Excellence — Cycle management (open/close, eligible faculty),
 *                         leaderboard ranking, and nomination review/shortlisting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Reusable Modal Wrapper ───────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-box">
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        <button className="btn-icon" onClick={onClose} aria-label="Close modal">✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Tab 1: Overview ──────────────────────────────────────────────────────────
const OverviewTab = ({ onTabChange }) => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => setStats(r.data.stats))
      .catch(e => setError(e.response?.data?.message || 'Failed to load system statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrap" role="status">
        <div className="spinner" />
        <span>Loading statistics…</span>
      </div>
    );
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Registered Students',  value: stats.studentCount,       sub: `${stats.activeStudentCount || 0} active`, icon: '👤', color: '#4f46e5' },
    { label: 'Faculty Members',      value: stats.facultyCount,       sub: 'in academic registry',                   icon: '👨‍🏫', color: '#06b6d4' },
    { label: 'Feedback Submissions', value: stats.submissionCount,    sub: 'total anonymous reviews',               icon: '📝', color: '#22c55e' },
    { label: 'Pending Nominations',  value: stats.pendingNominations, sub: 'awaiting committee review',             icon: '🏆', color: '#f59e0b' },
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

      {stats.studentCount === 0 && stats.facultyCount === 0 && (
        <div className="alert alert-info">
          The database currently contains no students or faculty records. Use the tabs below to add faculty and students.
        </div>
      )}

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '.75rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('students')}>Manage Students</button>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('faculty')}>Manage Faculty</button>
          <button className="btn btn-primary btn-sm" onClick={() => onTabChange('awards')}>Award Cycles & Nominations</button>
        </div>
      </div>
    </>
  );
};

// ── Tab 2: Students ──────────────────────────────────────────────────────────
const StudentsTab = () => {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm]               = useState({ name: '', email: '', rollNumber: '', password: '', semester: '', department: '', division: '' });
  const [formError, setFormError]     = useState('');
  const [saving, setSaving]           = useState(false);
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
    setForm({ name: '', email: '', rollNumber: '', password: '', semester: '', department: '', division: '' });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/api/admin/users', {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
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
        semester: form.semester ? Number(form.semester) : undefined,
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
      semester: s.semester || '',
      department: s.department || '',
      division: s.division || ''
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
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>Manage enrolled student accounts, credentials, and access.</p>
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
                    <td>{s.semester || '—'}</td>
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
            {[
              { id: 'cn', label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
              { id: 'ce', label: 'Email *', key: 'email', type: 'email', placeholder: 'e.g. priya@uem.edu.in' },
              { id: 'cr', label: 'Enrollment Number *', key: 'rollNumber', type: 'text', placeholder: 'e.g. 1202200201001' },
              { id: 'cp', label: 'Initial Password *', key: 'password', type: 'password', placeholder: 'min 6 characters' },
              { id: 'cd', label: 'Department *', key: 'department', type: 'text', placeholder: 'e.g. Computer Science & Engineering' },
              { id: 'cs', label: 'Semester (1–8)', key: 'semester', type: 'number', placeholder: '6' },
              { id: 'cdiv', label: 'Section / Division', key: 'division', type: 'text', placeholder: 'e.g. A' },
            ].map(f => (
              <div className="form-group" key={f.id}>
                <label htmlFor={f.id} className="form-label">{f.label}</label>
                <input
                  id={f.id}
                  type={f.type}
                  className="form-input"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Student'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <Modal title={`Edit Student — ${editStudent.name}`} onClose={() => setEditStudent(null)}>
          <form onSubmit={handleUpdate}>
            {formError && <div className="alert alert-error">{formError}</div>}
            {[
              { id: 'en', label: 'Full Name', key: 'name', type: 'text' },
              { id: 'ee', label: 'Email', key: 'email', type: 'email' },
              { id: 'er', label: 'Enrollment Number', key: 'rollNumber', type: 'text' },
              { id: 'ed', label: 'Department', key: 'department', type: 'text' },
              { id: 'es', label: 'Semester (1–8)', key: 'semester', type: 'number' },
              { id: 'ediv', label: 'Section / Division', key: 'division', type: 'text' },
            ].map(f => (
              <div className="form-group" key={f.id}>
                <label htmlFor={f.id} className="form-label">{f.label}</label>
                <input
                  id={f.id}
                  type={f.type}
                  className="form-input"
                  value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ── Tab 3: Faculty ───────────────────────────────────────────────────────────
const FacultyTab = () => {
  const [faculty, setFaculty]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  const [editFaculty, setEditFaculty]   = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [stats, setStats]               = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [form, setForm]                 = useState({ name: '', employeeId: '', department: '', designation: '' });
  const [formError, setFormError]       = useState('');
  const [saving, setSaving]             = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/faculty/all')
      .then(r => setFaculty(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load faculty records.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: '', employeeId: '', department: '', designation: '' });
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
    setForm({ name: f.name, employeeId: f.employeeId, department: f.department, designation: f.designation || '' });
    setEditFaculty(f);
    setFormError('');
  };

  const QUESTION_LABELS = {
    teaching_clarity: 'Teaching Clarity',
    subject_expertise: 'Subject Expertise',
    approachability: 'Approachability',
    class_preparation: 'Class Preparation',
    overall: 'Overall Rating',
  };

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Faculty Directory</h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>
              Click any faculty name to view anonymous feedback analytics and evaluation scores.
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
                  <th>Faculty Name</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th>
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
                        title="Click to view feedback analytics"
                      >
                        {f.name}
                      </button>
                    </td>
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
        <Modal title={`Performance Analytics — ${selectedFaculty.name}`} onClose={() => setSelectedFaculty(null)}>
          {statsLoading && <div className="spinner-wrap"><div className="spinner" /> Loading feedback metrics…</div>}
          {stats?.error && <div className="alert alert-error">Failed to calculate feedback statistics.</div>}
          {stats && !stats.error && (
            <>
              <div style={{ padding: '1rem', background: 'var(--clr-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '.9rem' }}>
                  Total Anonymous Responses: <strong>{stats.responseCount}</strong>
                  {stats.overallAverage !== null && (
                    <>&nbsp;·&nbsp; Overall Average Rating: <strong style={{ color: 'var(--clr-primary)' }}>{stats.overallAverage} / 5.0</strong></>
                  )}
                </p>
              </div>

              {stats.responseCount === 0 && (
                <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No feedback has been submitted for this faculty member yet.
                </p>
              )}

              {stats.responseCount > 0 && (
                <>
                  <h4 style={{ fontWeight: 600, fontSize: '.92rem', marginBottom: '.5rem' }}>Category Ratings Breakdown</h4>
                  <table className="table" style={{ marginBottom: '1.25rem' }}>
                    <thead><tr><th>Evaluation Criterion</th><th>Average Score</th></tr></thead>
                    <tbody>
                      {Object.entries(stats.averageScores || {}).map(([key, avg]) => (
                        <tr key={key}>
                          <td>{QUESTION_LABELS[key] || key}</td>
                          <td><strong>{avg}</strong> / 5.0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {stats.comments && stats.comments.length > 0 && (
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '.92rem', marginBottom: '.5rem' }}>Anonymous Student Comments</h4>
                      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        {stats.comments.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '.75rem',
                              background: '#f8fafc',
                              border: '1px solid var(--clr-border)',
                              borderRadius: 'var(--radius-md)',
                              marginBottom: '.5rem',
                              fontSize: '.85rem'
                            }}
                          >
                            {c.positiveComment && (
                              <p style={{ marginBottom: c.improvementComment ? '.35rem' : 0 }}>
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
            {[
              { id: 'fn', label: 'Full Name *', key: 'name', placeholder: 'e.g. Dr. Sourav Chakraborty' },
              { id: 'fe', label: 'Employee ID *', key: 'employeeId', placeholder: 'e.g. EMP-1042' },
              { id: 'fd', label: 'Department *', key: 'department', placeholder: 'e.g. Computer Science & Engineering' },
              { id: 'fg', label: 'Designation *', key: 'designation', placeholder: 'e.g. Associate Professor' },
            ].map(f => (
              <div className="form-group" key={f.id}>
                <label htmlFor={f.id} className="form-label">{f.label}</label>
                <input
                  id={f.id}
                  type="text"
                  className="form-input"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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

// ── Tab 4: Award of Excellence (Cycles & Leaderboard) ─────────────────────────
const AwardsTab = () => {
  const [subTab, setSubTab]           = useState('cycles'); // 'cycles' | 'leaderboard' | 'all'
  const [cycles, setCycles]           = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Cycle Modal states
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [editCycle, setEditCycle]             = useState(null);
  const [cycleForm, setCycleForm]             = useState({ title: '', academicYear: '', status: 'closed', eligibleFaculty: [] });
  const [cycleFormError, setCycleFormError]   = useState('');
  const [cycleSaving, setCycleSaving]         = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cyclesRes, leadRes, nomRes, facRes] = await Promise.all([
        api.get('/api/nomination-cycles'),
        api.get('/api/nominations/leaderboard'),
        api.get('/api/nominations'),
        api.get('/api/faculty/all'),
      ]);
      setCycles(cyclesRes.data.data || []);
      setLeaderboard(leadRes.data.data || []);
      setNominations(nomRes.data.data || []);
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
      setCycleForm({ title: '', academicYear: '', status: 'closed', eligibleFaculty: [] });
      loadData();
    } catch (err) {
      setCycleFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create nomination cycle.');
    } finally {
      setCycleSaving(false);
    }
  };

  // Update / Edit Cycle
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
      setCycleForm({ title: '', academicYear: '', status: 'closed', eligibleFaculty: [] });
      loadData();
    } catch (err) {
      setCycleFormError(err.response?.data?.message || 'Failed to update cycle.');
    } finally {
      setCycleSaving(false);
    }
  };

  // Toggle Cycle Open/Closed status
  const handleToggleCycleStatus = async (cycle) => {
    const nextStatus = cycle.status === 'open' ? 'closed' : 'open';
    const confirmMsg = nextStatus === 'open'
      ? `Open nomination cycle "${cycle.title}"? Students will immediately be able to nominate eligible faculty.`
      : `Close nomination cycle "${cycle.title}"? Students will no longer be able to submit nominations.`;
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

  // Toggle Shortlist status on nomination
  const handleToggleNominationStatus = async (nominationId, currentStatus) => {
    const nextStatus = currentStatus === 'shortlisted' ? 'pending' : 'shortlisted';
    try {
      await api.put(`/api/nominations/${nominationId}/status`, { status: nextStatus });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update nomination status.');
    }
  };

  // Open Edit Cycle Modal
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

  // Toggle eligible faculty selection checkbox
  const handleFacultyCheckbox = (facId) => {
    setCycleForm(prev => {
      const exists = prev.eligibleFaculty.includes(facId);
      const updated = exists
        ? prev.eligibleFaculty.filter(id => id !== facId)
        : [...prev.eligibleFaculty, facId];
      return { ...prev, eligibleFaculty: updated };
    });
  };

  const handleSelectAllFaculty = () => {
    setCycleForm(prev => ({
      ...prev,
      eligibleFaculty: facultyList.map(f => f._id),
    }));
  };

  const handleClearAllFaculty = () => {
    setCycleForm(prev => ({
      ...prev,
      eligibleFaculty: [],
    }));
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn btn-sm ${subTab === 'cycles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('cycles')}
        >
          Nomination Cycles
        </button>
        <button
          className={`btn btn-sm ${subTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('leaderboard')}
        >
          Leaderboard Ranking
        </button>
        <button
          className={`btn btn-sm ${subTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('all')}
        >
          All Nominations ({nominations.length})
        </button>
      </div>

      {loading && <div className="spinner-wrap"><div className="spinner" /> Loading…</div>}

      {/* ── Sub-tab 1: Cycles Management ─────────────────────────────── */}
      {!loading && subTab === 'cycles' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Award Nomination Cycles</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem' }}>
                Define award cycles, select eligible faculty, and control student submission windows.
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

          {cycles.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>
              No nomination cycles created yet. Click "+ Create Award Cycle" to open nominations for students.
            </p>
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
                  {cycles.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td>{c.academicYear}</td>
                      <td>
                        <span className={`badge ${c.status === 'open' ? 'badge-green' : 'badge-red'}`}>
                          {c.status === 'open' ? '🟢 Open for Submissions' : '🔴 Closed'}
                        </span>
                      </td>
                      <td>
                        {(c.eligibleFaculty || []).length} faculty member{(c.eligibleFaculty || []).length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '.4rem' }}
                          onClick={() => openEditCycleModal(c)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${c.status === 'open' ? 'btn-danger' : 'btn-primary'}`}
                          disabled={actionInProgress}
                          onClick={() => handleToggleCycleStatus(c)}
                        >
                          {c.status === 'open' ? 'Close Cycle' : 'Open Cycle'}
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

      {/* ── Sub-tab 2: Leaderboard ───────────────────────────────────── */}
      {!loading && subTab === 'leaderboard' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Award of Excellence — Faculty Leaderboard</h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem', marginBottom: '1.25rem' }}>
            Faculty members ranked by total primary student nominations. Submissions are strictly anonymous.
          </p>

          {leaderboard.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>
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
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.04)' : '#ffffff'
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
                        fontSize: '.95rem'
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{item.faculty?.name || 'Unknown Faculty'}</p>
                      <p style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', margin: 0 }}>
                        {item.faculty?.department} &nbsp;·&nbsp; {item.faculty?.designation || 'Faculty'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span className="badge badge-blue">
                      {item.nominationCount} Nomination{item.nominationCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {item.reasons && item.reasons.length > 0 && (
                  <div style={{ marginTop: '.85rem', borderTop: '1px solid var(--clr-border)', paddingTop: '.75rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--clr-text-muted)', letterSpacing: '.05em', marginBottom: '.4rem' }}>
                      ANONYMOUS STUDENT CITATIONS & REASONS:
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
                          fontStyle: 'italic'
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

      {/* ── Sub-tab 3: All Nominations List ───────────────────────────── */}
      {!loading && subTab === 'all' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>All Submitted Nominations</h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '.84rem', marginBottom: '1.25rem' }}>
            Individual nominations reviewed for committee consideration. Student identity is strictly segregated and unrecorded.
          </p>

          {nominations.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>No individual nominations submitted yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Primary Nominee</th>
                    <th>Nomination Citation</th>
                    <th>Additional Nominees</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nominations.map(n => (
                    <tr key={n._id}>
                      <td style={{ fontWeight: 600 }}>
                        {n.primaryFaculty?.name || '—'}
                        <div style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)' }}>{n.primaryFaculty?.department}</div>
                      </td>
                      <td style={{ maxWidth: '300px', fontSize: '.85rem' }}>
                        "{n.primaryReason}"
                      </td>
                      <td style={{ fontSize: '.82rem' }}>
                        {n.additionalNominees && n.additionalNominees.length > 0 ? (
                          n.additionalNominees.map((a, i) => (
                            <div key={i} style={{ marginBottom: '.25rem' }}>
                              • {a.faculty?.name || 'Faculty'}
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--clr-text-muted)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${n.status === 'shortlisted' ? 'badge-yellow' : 'badge-blue'}`}>
                          {n.status === 'shortlisted' ? '★ Shortlisted' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${n.status === 'shortlisted' ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleToggleNominationStatus(n._id, n.status)}
                        >
                          {n.status === 'shortlisted' ? 'Remove Shortlist' : 'Shortlist'}
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

      {/* ── Modal: Create Cycle ──────────────────────────────────────── */}
      {showCreateCycle && (
        <Modal title="Create Award of Excellence Cycle" onClose={() => setShowCreateCycle(false)}>
          <form onSubmit={handleCreateCycle}>
            {cycleFormError && <div className="alert alert-error">{cycleFormError}</div>}

            <div className="form-group">
              <label htmlFor="cc-title" className="form-label">Cycle Title *</label>
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
                <option value="closed">Closed (Keep hidden/inactive until ready)</option>
                <option value="open">Open (Immediately accept student nominations)</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Eligible Faculty Members ({cycleForm.eligibleFaculty.length} selected)
                </label>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button type="button" className="btn btn-link btn-sm" onClick={handleSelectAllFaculty} style={{ fontSize: '.78rem' }}>
                    Select All
                  </button>
                  <button type="button" className="btn btn-link btn-sm" onClick={handleClearAllFaculty} style={{ fontSize: '.78rem' }}>
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

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
              <label htmlFor="ec-title" className="form-label">Cycle Title</label>
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
                  <button type="button" className="btn btn-link btn-sm" onClick={handleSelectAllFaculty} style={{ fontSize: '.78rem' }}>
                    Select All
                  </button>
                  <button type="button" className="btn btn-link btn-sm" onClick={handleClearAllFaculty} style={{ fontSize: '.78rem' }}>
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

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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

// ── Root Admin Dashboard Component ───────────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'students',  label: 'Students' },
    { id: 'faculty',   label: 'Faculty' },
    { id: 'awards',    label: 'Award of Excellence' },
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

        {tab === 'overview'  && <OverviewTab onTabChange={setTab} />}
        {tab === 'students'  && <StudentsTab />}
        {tab === 'faculty'   && <FacultyTab />}
        {tab === 'awards'    && <AwardsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
