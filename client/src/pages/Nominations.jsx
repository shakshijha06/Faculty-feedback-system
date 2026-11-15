/**
 * pages/Nominations.jsx — Award of Excellence Faculty Nomination Workflow
 *
 * Professional Corporate Institutional Redesign:
 * - Active cycle validation with academic year & title
 * - Primary nominee selection with citation requirement
 * - Additional nominees with remove controls
 * - Display of faculty names and timetable initials
 * - Clear submission state & duplicate submission protection
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Plus, Trash2, CheckCircle2, AlertCircle, Info, UserCheck } from 'lucide-react';
import api from '../services/api';
import { getEffectiveInitials } from '../utils/facultySearch';

const Nominations = () => {
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [myNomination, setMyNomination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form state
  const [primaryFaculty, setPrimaryFaculty] = useState('');
  const [primaryReason, setPrimaryReason] = useState('');
  const [extras, setExtras] = useState([]); // [{ faculty: '', reason: '' }]
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const cycleRes = await api.get('/api/nomination-cycles/active');
        const activeCycle = cycleRes.data.data;
        setCycle(activeCycle);

        if (cycleRes.data.hasSubmitted) {
          setHasSubmitted(true);
          setMyNomination(cycleRes.data.userNomination);
        } else {
          const mineRes = await api.get('/api/nominations/mine');
          if (mineRes.data.data) {
            setHasSubmitted(true);
            setMyNomination(mineRes.data.data);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load nomination information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addExtra = () => {
    if (extras.length < 2) setExtras(p => [...p, { faculty: '', reason: '' }]);
  };

  const removeExtra = (i) => setExtras(p => p.filter((_, idx) => idx !== i));

  const setExtraField = (i, field, val) =>
    setExtras(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const validate = () => {
    const errs = {};
    if (!primaryFaculty) errs.primaryFaculty = 'Please select a primary faculty nominee.';
    if (!primaryReason || primaryReason.trim().length < 10) {
      errs.primaryReason = 'Please provide a substantive nomination citation of at least 10 characters.';
    }
    extras.forEach((ex, i) => {
      if (!ex.faculty) errs[`extra_faculty_${i}`] = 'Please select a faculty member for this additional nomination.';
      if (!ex.reason || ex.reason.trim().length < 10) {
        errs[`extra_reason_${i}`] = 'Please provide a nomination citation of at least 10 characters.';
      }
    });
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/api/nominations', {
        primaryFaculty,
        primaryReason: primaryReason.trim(),
        additionalNominees: extras.map(ex => ({ faculty: ex.faculty, reason: ex.reason.trim() })),
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap" role="status">
        <div className="spinner" />
        <span>Loading Award of Excellence cycle data…</span>
      </div>
    );
  }

  // Success view
  if (success) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--clr-success-bg)', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)' }}>
              Nomination Submitted Successfully
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your nomination for the <strong>{cycle?.title}</strong> ({cycle?.academicYear}) cycle has been submitted to the Academic Review Committee.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted view
  if (hasSubmitted || myNomination) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 620 }}>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--clr-primary-subtle)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--clr-text)' }}>
                  Award Nomination Already Recorded
                </h2>
                <p style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', margin: 0 }}>
                  Cycle: {cycle?.title || 'Annual Award Cycle'} ({cycle?.academicYear || 'Current Year'})
                </p>
              </div>
            </div>

            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {myNomination?.primaryFaculty?.name
                ? `You have already submitted your primary nomination for ${myNomination.primaryFaculty.name} in this academic cycle.`
                : 'You have submitted all available nomination forms for this active cycle.'}
            </p>

            <div className="alert alert-info" style={{ fontSize: '.84rem', margin: 0 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Students are permitted one nomination submission per academic cycle. When a new award cycle is opened by the administration, eligible students will automatically see the new nomination form here.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No active cycle view
  if (!cycle) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 620 }}>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--clr-surface-alt)', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Award size={24} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)' }}>
              No Active Nomination Cycle
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.88rem', lineHeight: 1.5 }}>
              There are currently no open Award of Excellence nomination cycles. The academic administration will notify students when the next nomination period begins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const eligible = cycle.eligibleFaculty || [];

  if (eligible.length === 0) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 620 }}>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.88rem' }}>
              No eligible faculty members have been configured for this cycle yet. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

        <div className="page-header">
          <div>
            <h1 className="page-title">Award of Excellence Nomination</h1>
            <p className="page-subtitle">
              Active Cycle: <strong>{cycle.title}</strong> · Academic Year: <strong>{cycle.academicYear}</strong>
            </p>
          </div>
          <span className="badge badge-blue" style={{ alignSelf: 'center' }}>
            Nomination Period Active
          </span>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} /> <div>{error}</div>
          </div>
        )}
        {submitError && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} /> <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Primary Nominee Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title" style={{ fontSize: '1rem' }}>
                  Primary Nominee <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </h2>
                <p className="card-desc">Your foremost recommendation for the institutional Award of Excellence.</p>
              </div>
              <span className="badge badge-blue">Mandatory</span>
            </div>

            <div className="form-group">
              <label htmlFor="primary-faculty" className="form-label">Select Faculty Member</label>
              <select
                id="primary-faculty"
                className="form-input form-select"
                value={primaryFaculty}
                onChange={e => {
                  setPrimaryFaculty(e.target.value);
                  if (formErrors.primaryFaculty) setFormErrors(p => ({ ...p, primaryFaculty: null }));
                }}
              >
                <option value="">— Select faculty from eligible roster —</option>
                {eligible.map(f => {
                  const abbr = getEffectiveInitials(f);
                  return (
                    <option key={f._id} value={f._id}>
                      {f.name} {abbr ? `(${abbr})` : ''} — {f.department}
                    </option>
                  );
                })}
              </select>
              {formErrors.primaryFaculty && <p className="form-error">{formErrors.primaryFaculty}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="primary-reason" className="form-label">
                Nomination Citation &amp; Justification <span style={{ color: 'var(--clr-danger)' }}>*</span>
              </label>
              <textarea
                id="primary-reason"
                className="form-input"
                rows={4}
                placeholder="Explain why this faculty member demonstrates excellence in teaching methodology, mentorship, academic dedication, or student guidance (minimum 10 characters)…"
                value={primaryReason}
                onChange={e => {
                  setPrimaryReason(e.target.value);
                  if (formErrors.primaryReason) setFormErrors(p => ({ ...p, primaryReason: null }));
                }}
              />
              {formErrors.primaryReason && <p className="form-error">{formErrors.primaryReason}</p>}
            </div>
          </div>

          {/* Additional Nominees Cards */}
          {extras.map((ex, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title" style={{ fontSize: '.95rem' }}>Additional Nominee {i + 1}</h3>
                  <p className="card-desc">Optional secondary recommendation</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger-border)' }}
                  onClick={() => removeExtra(i)}
                  aria-label="Remove this nominee"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Select Faculty Member</label>
                <select
                  className="form-input form-select"
                  value={ex.faculty}
                  onChange={e => setExtraField(i, 'faculty', e.target.value)}
                >
                  <option value="">— Select faculty —</option>
                  {eligible
                    .filter(f => f._id !== primaryFaculty && !extras.some((e2, j) => j !== i && e2.faculty === f._id))
                    .map(f => {
                      const abbr = getEffectiveInitials(f);
                      return (
                        <option key={f._id} value={f._id}>
                          {f.name} {abbr ? `(${abbr})` : ''} — {f.department}
                        </option>
                      );
                    })}
                </select>
                {formErrors[`extra_faculty_${i}`] && <p className="form-error">{formErrors[`extra_faculty_${i}`]}</p>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Citation &amp; Justification</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Detail this faculty member's achievements and teaching qualities…"
                  value={ex.reason}
                  onChange={e => setExtraField(i, 'reason', e.target.value)}
                />
                {formErrors[`extra_reason_${i}`] && <p className="form-error">{formErrors[`extra_reason_${i}`]}</p>}
              </div>
            </div>
          ))}

          {extras.length < 2 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addExtra}
              >
                <Plus size={15} /> Add Another Nominee (Optional, up to 2)
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: '180px' }}
            >
              {submitting ? 'Submitting Citation…' : 'Submit Final Nomination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Nominations;
