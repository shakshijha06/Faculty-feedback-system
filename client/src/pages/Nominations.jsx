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
  const [hasSubmitted,   setHasSubmitted]   = useState(false);
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
        const cycleRes = await api.get('/api/nomination-cycles/active');
        const activeCycle = cycleRes.data.data;
        setCycle(activeCycle);

        if (cycleRes.data.hasSubmitted) {
          setHasSubmitted(true);
          setMyNomination(cycleRes.data.userNomination);
        } else {
          // Double check /api/nominations/mine for active cycle
          const mineRes = await api.get('/api/nominations/mine');
          if (mineRes.data.data) {
            setHasSubmitted(true);
            setMyNomination(mineRes.data.data);
          }
        }
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

  // Success after submit
  if (success) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-success)' }}>✓</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nomination Submitted</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
          Your nomination has been submitted successfully for the <strong>{cycle?.title}</strong> award cycle.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div></div>
  );

  // Already submitted for open cycle or all available cycles answered
  if (hasSubmitted || myNomination) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-primary)' }}>🏆</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>No new nomination forms available.</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.25rem' }}>
          {myNomination?.primaryFaculty?.name
            ? `You have already submitted your nomination for ${myNomination.primaryFaculty.name} in this cycle.`
            : 'You have submitted all available nomination forms.'}
        </p>
        <div className="alert alert-info" style={{ textAlign: 'left' }}>
          When a new nomination cycle is opened by the administration, eligible students will automatically see the new nomination form here.
        </div>
      </div>
    </div></div>
  );

  // No open cycle
  if (!cycle) return (
    <div className="page"><div className="container" style={{ maxWidth: 600 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-text-muted)' }}>🏆</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>No new nomination forms available.</h2>
        <p style={{ color: 'var(--clr-text-muted)' }}>
          No nomination cycle is currently active. When an award cycle is opened, it will appear here.
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
