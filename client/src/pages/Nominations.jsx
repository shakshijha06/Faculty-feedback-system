/**
 * pages/Nominations.jsx — Award of Excellence nomination form
 *
 * Route: /nominations
 *
 * 1. Fetch active nomination cycle from /api/nomination-cycles/active
 * 2. If closed or no cycle, show a clear closed state
 * 3. Allow student to select primary nominee (from eligibleFaculty[])
 *    and up to 2 additional nominees, each with a reason
 * 4. Check whether student already submitted via /api/nominations/mine
 * 5. Submit to POST /api/nominations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Nominations = () => {
  const navigate = useNavigate();

  const [cycle,          setCycle]          = useState(null);
  const [myNomination,   setMyNomination]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitError,    setSubmitError]    = useState('');

  // Form state
  const [primaryFaculty, setPrimaryFaculty]   = useState('');
  const [primaryReason,  setPrimaryReason]    = useState('');
  const [extras,         setExtras]           = useState([]);  // [{faculty:'', reason:''}]
  const [formErrors,     setFormErrors]       = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [cycleRes, mineRes] = await Promise.all([
          api.get('/api/nomination-cycles/active'),
          api.get('/api/nominations/mine'),
        ]);
        setCycle(cycleRes.data.data);
        setMyNomination(mineRes.data.data);
      } catch (err) {
        setError(err.message || 'Failed to load nomination information.');
      } finally { setLoading(false); }
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
    if (!primaryFaculty) errs.primaryFaculty = 'Please select a primary nominee.';
    if (!primaryReason || primaryReason.trim().length < 10)
      errs.primaryReason = 'Please provide a reason of at least 10 characters.';
    extras.forEach((ex, i) => {
      if (!ex.faculty) errs[`extra_faculty_${i}`] = 'Please select a faculty for this additional nominee.';
      if (!ex.reason || ex.reason.trim().length < 10)
        errs[`extra_reason_${i}`] = 'Please provide a reason of at least 10 characters.';
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
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /> Loading…</div>;

  // Already submitted
  if (myNomination && !success) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-success)' }}>✓</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nomination Submitted</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.25rem' }}>
          You have already nominated <strong>{myNomination.primaryFaculty?.name}</strong> for this award cycle.
        </p>
        <div className="alert alert-info" style={{ textAlign: 'left' }}>
          Nominations are reviewed by the authorized college committee. You will be informed of results through official channels.
        </div>
      </div>
    </div></div>
  );

  // Success after submit
  if (success) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-success)' }}>✓</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nomination Submitted</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
          Your nomination has been submitted for the <strong>{cycle?.title}</strong> award cycle.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div></div>
  );

  // No open cycle
  if (!cycle) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-text-muted)' }}>🏆</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nominations Not Open</h2>
        <p style={{ color: 'var(--clr-text-muted)' }}>
          No nomination cycle is currently active. Please check back later or contact your administrator.
        </p>
      </div>
    </div></div>
  );

  const eligible = cycle.eligibleFaculty || [];

  if (eligible.length === 0) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <p style={{ color: 'var(--clr-text-muted)' }}>No eligible faculty members have been configured for this cycle yet.</p>
      </div>
    </div></div>
  );

  // Nomination form
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1 className="page-title">Award of Excellence — Nominate Faculty</h1>
        <p className="page-subtitle">Cycle: <strong>{cycle.title}</strong> ({cycle.academicYear})</p>

        {error      && <div className="alert alert-error">{error}</div>}
        {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Primary nominee */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Primary Nominee <span style={{ color: 'var(--clr-danger)' }}>*</span></h3>

            <div className="form-group">
              <label htmlFor="primary-faculty" className="form-label">Faculty Member</label>
              <select id="primary-faculty" className="form-input form-select"
                value={primaryFaculty} onChange={e => setPrimaryFaculty(e.target.value)}>
                <option value="">— Select faculty —</option>
                {eligible.map(f => (
                  <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
                ))}
              </select>
              {formErrors.primaryFaculty && <p className="form-error">{formErrors.primaryFaculty}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="primary-reason" className="form-label">Reason for Nomination <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
              <textarea id="primary-reason" className="form-input" rows={4}
                placeholder="Describe why this faculty member deserves the Award of Excellence…"
                value={primaryReason} onChange={e => setPrimaryReason(e.target.value)} />
              {formErrors.primaryReason && <p className="form-error">{formErrors.primaryReason}</p>}
            </div>
          </div>

          {/* Additional nominees */}
          {extras.map((ex, i) => (
            <div key={i} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <h3 style={{ fontWeight: 700 }}>Additional Nominee {i + 1}</h3>
                <button type="button" className="btn-icon" onClick={() => removeExtra(i)} aria-label="Remove nominee">×</button>
              </div>
              <div className="form-group">
                <label className="form-label">Faculty Member</label>
                <select className="form-input form-select"
                  value={ex.faculty} onChange={e => setExtraField(i, 'faculty', e.target.value)}>
                  <option value="">— Select faculty —</option>
                  {eligible
                    .filter(f => f._id !== primaryFaculty && !extras.some((e2, j) => j !== i && e2.faculty === f._id))
                    .map(f => (
                      <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
                    ))}
                </select>
                {formErrors[`extra_faculty_${i}`] && <p className="form-error">{formErrors[`extra_faculty_${i}`]}</p>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reason</label>
                <textarea className="form-input" rows={3}
                  value={ex.reason} onChange={e => setExtraField(i, 'reason', e.target.value)} />
                {formErrors[`extra_reason_${i}`] && <p className="form-error">{formErrors[`extra_reason_${i}`]}</p>}
              </div>
            </div>
          ))}

          {extras.length < 2 && (
            <button type="button" className="btn btn-secondary" style={{ marginBottom: '1.25rem' }} onClick={addExtra}>
              + Add Another Nominee (Optional)
            </button>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Nomination'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Nominations;
