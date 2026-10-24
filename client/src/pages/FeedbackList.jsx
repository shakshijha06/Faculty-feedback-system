/**
 * pages/FeedbackList.jsx — Interactive Student Faculty Evaluation
 *
 * Requirements:
 * - Student remains on the main feedback page (no navigation to a separate page per faculty).
 * - Clicking a faculty card expands the 7-factor evaluation form INLINE; clicking again collapses it.
 * - Shows clear completion status badges ("Completed ✓", "In Progress", "Not Started").
 * - Automatic background draft saving with debounce (no manual "Save Draft" button).
 * - Subtle status indicator: "Saving…", "Draft saved", or "Unable to save".
 * - 7 official evaluation factors with 1–5 star ratings and mandatory reasons (>= 5 chars).
 * - Mandatory overall written comment (>= 10 chars).
 * - Preserves in-progress drafts across sessions and when toggling between faculty members.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FEEDBACK_FACTORS } from '../constants/academicData';

const CURRENT_YEAR = '2024-25';

// ── Horizontal 1–5 Radio Rating Component (No star symbols, no "x/5" text) ───
const RadioRating = ({ factorKey, facultyId, value, onChange }) => (
  <div className="radio-rating-group" role="radiogroup" aria-labelledby={`q-label-${factorKey}`}>
    {[1, 2, 3, 4, 5].map(n => (
      <label
        key={n}
        className={`radio-rating-label ${value === n ? 'active' : ''}`}
        htmlFor={`rating-${facultyId}-${factorKey}-${n}`}
      >
        <input
          type="radio"
          id={`rating-${facultyId}-${factorKey}-${n}`}
          name={`rating-${facultyId}-${factorKey}`}
          value={n}
          checked={value === n}
          onChange={() => onChange(n)}
          className="radio-rating-input"
        />
        <span className="radio-num">{n}</span>
      </label>
    ))}
  </div>
);

// ── Inline Faculty Feedback Form ─────────────────────────────────────────────
const InlineFeedbackForm = ({ faculty, onSubmitted, onDraftStateChange }) => {
  const [ratings, setRatings] = useState(() =>
    Object.fromEntries(FEEDBACK_FACTORS.map(f => [f.key, { score: 0, reason: '' }]))
  );
  const [overallComment, setOverallComment] = useState('');

  const [loadingDraft, setLoadingDraft] = useState(true);
  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isInitialLoad = useRef(true);
  const isSubmittedRef = useRef(false);
  const autosaveTimeoutRef = useRef(null);
  const latestRequestSeq = useRef(0);

  // Load existing draft from server on mount
  useEffect(() => {
    let active = true;
    const fetchDraft = async () => {
      try {
        const { data } = await api.get(`/api/feedback/draft/${faculty._id}?year=${CURRENT_YEAR}`);
        if (!active) return;
        if (data.data) {
          const d = data.data;
          if (Array.isArray(d.ratings) && d.ratings.length > 0) {
            setRatings(prev => {
              const updated = { ...prev };
              d.ratings.forEach(r => {
                if (updated[r.questionKey]) {
                  updated[r.questionKey] = {
                    score: r.score || 0,
                    reason: r.reason || '',
                  };
                }
              });
              return updated;
            });
            onDraftStateChange(faculty._id, true);
          }
          if (d.overallComment) setOverallComment(d.overallComment);
          if (d.lastSaved) {
            const timeStr = new Date(d.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastSavedTime(timeStr);
            setAutosaveStatus('saved');
          }
        }
      } catch {
        /* start with clean form if draft load fails */
      } finally {
        if (active) {
          setLoadingDraft(false);
          setTimeout(() => { isInitialLoad.current = false; }, 300);
        }
      }
    };
    fetchDraft();
    return () => {
      active = false;
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [faculty._id, onDraftStateChange]);

  // Debounced Autosave Engine
  const triggerAutosave = useCallback(async (currentRatings, currentOverall) => {
    if (isInitialLoad.current || isSubmittedRef.current) return;

    const hasData = Object.values(currentRatings).some(r => (r.score && r.score > 0) || r.reason.trim().length > 0) ||
      currentOverall.trim().length > 0;

    if (!hasData) return;

    setAutosaveStatus('saving');
    const seq = ++latestRequestSeq.current;

    try {
      const payloadRatings = FEEDBACK_FACTORS.map(f => ({
        questionKey: f.key,
        label: f.label,
        score: currentRatings[f.key]?.score || 0,
        reason: currentRatings[f.key]?.reason || '',
      }));

      const { data } = await api.post(`/api/feedback/draft/${faculty._id}`, {
        ratings: payloadRatings,
        overallComment: currentOverall,
        academicYear: CURRENT_YEAR,
      });

      if (seq === latestRequestSeq.current && !isSubmittedRef.current) {
        setAutosaveStatus('saved');
        const savedAt = data.data?.lastSaved ? new Date(data.data.lastSaved) : new Date();
        setLastSavedTime(savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        onDraftStateChange(faculty._id, true);
      }
    } catch {
      if (seq === latestRequestSeq.current && !isSubmittedRef.current) {
        setAutosaveStatus('error');
      }
    }
  }, [faculty._id, onDraftStateChange]);

  const scheduleAutosave = (newRatings, newOverall) => {
    if (isSubmittedRef.current) return;
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      triggerAutosave(newRatings, newOverall);
    }, 800);
  };

  const handleScoreChange = (key, score) => {
    const updated = { ...ratings, [key]: { ...ratings[key], score } };
    setRatings(updated);
    if (errors[`${key}_score`]) setErrors(prev => ({ ...prev, [`${key}_score`]: null }));
    scheduleAutosave(updated, overallComment);
  };

  const handleReasonChange = (key, reason) => {
    const updated = { ...ratings, [key]: { ...ratings[key], reason } };
    setRatings(updated);
    if (errors[`${key}_reason`]) setErrors(prev => ({ ...prev, [`${key}_reason`]: null }));
    scheduleAutosave(updated, overallComment);
  };

  const handleOverallChange = (val) => {
    setOverallComment(val);
    if (errors.overallComment) setErrors(prev => ({ ...prev, overallComment: null }));
    scheduleAutosave(ratings, val);
  };

  // Client Validation for final submission
  const validateForm = () => {
    const errs = {};
    FEEDBACK_FACTORS.forEach(f => {
      if (!ratings[f.key]?.score || ratings[f.key].score < 1) {
        errs[`${f.key}_score`] = 'Please select a rating (1–5).';
      }
      if (!ratings[f.key]?.reason || ratings[f.key].reason.trim().length < 5) {
        errs[`${f.key}_reason`] = 'Please explain your rating (minimum 5 characters).';
      }
    });

    if (!overallComment || overallComment.trim().length < 10) {
      errs.overallComment = 'Please provide an overall evaluation comment (minimum 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      setSubmitError('Please address the highlighted criteria before submitting.');
      return;
    }

    // Cancel any queued autosaves and prevent post-submit autosave race
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    isSubmittedRef.current = true;
    setSubmitting(true);

    try {
      const payloadRatings = FEEDBACK_FACTORS.map(f => ({
        questionKey: f.key,
        label: f.label,
        score: ratings[f.key].score,
        reason: ratings[f.key].reason.trim(),
      }));

      await api.post('/api/feedback/submit', {
        facultyId: faculty._id,
        academicYear: CURRENT_YEAR,
        ratings: payloadRatings,
        overallComment: overallComment.trim(),
      });

      setAutosaveStatus('idle');
      onSubmitted(faculty._id);
    } catch (err) {
      isSubmittedRef.current = false;
      setSubmitError(err.response?.data?.message || err.message || 'Submission failed. Please check your answers and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="spinner-wrap" style={{ padding: '2rem' }}>
        <div className="spinner" />
        <span style={{ fontSize: '.88rem', color: 'var(--clr-text-muted)' }}>Restoring your saved progress…</span>
      </div>
    );
  }

  return (
    <div className="inline-feedback-container" style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
      {/* Autosave Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>
          Evaluating: <strong style={{ color: 'var(--clr-text)' }}>{faculty.name}</strong> ({faculty.designation || 'Faculty'})
        </div>
        <div style={{ fontSize: '.82rem' }}>
          {autosaveStatus === 'saving' && (
            <span style={{ color: 'var(--clr-primary)', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
              <span className="spinner-sm" /> Saving draft…
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span style={{ color: 'var(--clr-success)', fontWeight: 500 }}>
              ✓ Draft saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
            </span>
          )}
          {autosaveStatus === 'error' && (
            <span style={{ color: 'var(--clr-danger)' }}>
              ⚠️ Unable to save draft to server
            </span>
          )}
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.5rem', fontSize: '.85rem' }}>
        🔒 <strong>Anonymous Evaluation:</strong> Your name and roll number are never recorded in feedback results. Feedback ratings are continuously autosaved to your student profile so you can resume anytime.
      </div>

      {submitError && <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>{submitError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Seven Evaluation Factors */}
        {FEEDBACK_FACTORS.map((f, idx) => {
          const currentRating = ratings[f.key] || { score: 0, reason: '' };
          const hasScoreErr = !!errors[`${f.key}_score`];
          const hasReasonErr = !!errors[`${f.key}_reason`];

          return (
            <div
              key={f.key}
              style={{
                background: idx % 2 === 0 ? 'var(--clr-surface)' : 'var(--clr-surface-alt)',
                border: hasScoreErr || hasReasonErr ? '1px solid var(--clr-danger)' : '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem', marginBottom: '.6rem' }}>
                <div>
                  <label id={`q-label-${f.key}`} style={{ fontWeight: 600, fontSize: '.95rem', display: 'block', color: 'var(--clr-text)' }}>
                    {idx + 1}. {f.label} <span style={{ color: 'var(--clr-danger)' }}>*</span>
                  </label>
                  <p style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', margin: '0.15rem 0 0 0' }}>{f.desc}</p>
                </div>
                <div>
                  <RadioRating factorKey={f.key} facultyId={faculty._id} value={currentRating.score} onChange={s => handleScoreChange(f.key, s)} />
                </div>
              </div>

              {hasScoreErr && <p className="form-error" style={{ marginBottom: '.5rem' }}>{errors[`${f.key}_score`]}</p>}

              {/* Justification input */}
              <div style={{ marginTop: '.6rem' }}>
                <label htmlFor={`reason-${faculty._id}-${f.key}`} style={{ display: 'block', fontSize: '.8rem', fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: '.3rem' }}>
                  Specific Reason / Context <span style={{ color: 'var(--clr-danger)' }}>*</span> (minimum 5 characters)
                </label>
                <textarea
                  id={`reason-${faculty._id}-${f.key}`}
                  className="form-input"
                  rows={2}
                  placeholder={`Explain why you gave this rating for ${f.label.toLowerCase()}...`}
                  value={currentRating.reason}
                  onChange={e => handleReasonChange(f.key, e.target.value)}
                  style={{ fontSize: '.88rem', resize: 'vertical' }}
                />
                {hasReasonErr && <p className="form-error">{errors[`${f.key}_reason`]}</p>}
              </div>
            </div>
          );
        })}

        {/* Overall Written Comment (Mandatory) */}
        <div
          style={{
            background: 'var(--clr-surface)',
            border: errors.overallComment ? '1px solid var(--clr-danger)' : '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <label htmlFor={`overall-${faculty._id}`} style={{ fontWeight: 600, fontSize: '.95rem', display: 'block', marginBottom: '.25rem' }}>
            Overall Feedback <span style={{ color: 'var(--clr-danger)' }}>*</span>
          </label>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', marginBottom: '.6rem' }}>
            Summarize your learning experience, key takeaways, and constructive recommendations for this professor (minimum 10 characters).
          </p>
          <textarea
            id={`overall-${faculty._id}`}
            className="form-input"
            rows={3}
            placeholder="Write your constructive overall feedback here..."
            value={overallComment}
            onChange={e => handleOverallChange(e.target.value)}
            style={{ fontSize: '.88rem' }}
          />
          {errors.overallComment && <p className="form-error">{errors.overallComment}</p>}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>
            All responses are automatically saved as you write.
          </span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '180px' }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main Feedback List Page with Inline Expansion ────────────────────────────
const FeedbackList = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // facultyId -> { submitted: boolean, hasDraft: boolean }
  const [expandedFacultyId, setExpandedFacultyId] = useState(null);
  const [submittedSuccessMsg, setSubmittedSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get('/api/faculty/my-department');
        if (!isMounted) return;
        const list = data.data || [];
        setFaculty(list);

        // Fetch submission status & draft state for each faculty member
        const statusPromises = list.map(f =>
          Promise.allSettled([
            api.get(`/api/feedback/status/${f._id}?year=${CURRENT_YEAR}`),
            api.get(`/api/feedback/draft/${f._id}?year=${CURRENT_YEAR}`),
          ])
        );

        const allResults = await Promise.all(statusPromises);
        if (!isMounted) return;

        const map = {};
        allResults.forEach(([statusRes, draftRes], idx) => {
          const fid = list[idx]._id;
          const submitted = statusRes.status === 'fulfilled' && statusRes.value.data?.hasSubmitted;
          const hasDraft = draftRes.status === 'fulfilled' && !!draftRes.value.data?.data;
          map[fid] = { submitted, hasDraft };
        });
        setStatusMap(map);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load department faculty list.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleToggleExpand = (facId) => {
    setSubmittedSuccessMsg('');
    setExpandedFacultyId(prev => (prev === facId ? null : facId));
  };

  const handleDraftStateChange = useCallback((facId, hasDraft) => {
    setStatusMap(prev => ({
      ...prev,
      [facId]: { ...prev[facId], hasDraft },
    }));
  }, []);

  const handleSubmitted = useCallback((facId) => {
    setStatusMap(prev => ({
      ...prev,
      [facId]: { submitted: true, hasDraft: false },
    }));
    setExpandedFacultyId(null);
    const facultyMember = faculty.find(f => f._id === facId);
    setSubmittedSuccessMsg(`Thank you! Your feedback for ${facultyMember?.name || 'the faculty member'} has been submitted anonymously.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [faculty]);

  if (loading) {
    return (
      <div className="spinner-wrap" role="status">
        <div className="spinner" />
        <span>Loading department faculty list…</span>
      </div>
    );
  }

  const completedCount = Object.values(statusMap).filter(s => s.submitted).length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 840 }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '.3rem' }}>Semester Faculty Feedback</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Academic Year {CURRENT_YEAR} · Evaluated: <strong>{completedCount} of {faculty.length}</strong> faculty members
            </p>
          </div>
        </div>

        {submittedSuccessMsg && (
          <div className="alert alert-success" role="status" style={{ marginBottom: '1.25rem' }}>
            ✓ {submittedSuccessMsg}
          </div>
        )}

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {!error && faculty.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-text-muted)' }}>👨‍🏫</div>
            <p style={{ fontWeight: 600, marginBottom: '.4rem' }}>No Faculty Members Found</p>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.9rem' }}>
              No active faculty members are currently listed for your department. Please contact your academic administrator.
            </p>
          </div>
        )}

        {/* Faculty List with Inline Expandable Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faculty.map(f => {
            const isSubmitted = statusMap[f._id]?.submitted;
            const hasDraft = statusMap[f._id]?.hasDraft;
            const isExpanded = expandedFacultyId === f._id;

            return (
              <div
                key={f._id}
                className="card"
                style={{
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  borderColor: isExpanded ? 'var(--clr-primary)' : 'var(--clr-border)',
                  boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  padding: '1.25rem 1.5rem',
                }}
              >
                {/* Faculty Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '.75rem',
                    cursor: isSubmitted ? 'default' : 'pointer',
                  }}
                  onClick={() => {
                    if (!isSubmitted) handleToggleExpand(f._id);
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--clr-text)' }}>
                        {f.name}
                      </h3>
                      {f.employeeId && (
                        <span style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)', background: 'var(--clr-surface-alt)', padding: '.15rem .45rem', borderRadius: 'var(--radius-sm)' }}>
                          ID: {f.employeeId}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)', marginTop: '.25rem' }}>
                      {f.designation && <span>{f.designation}</span>}
                      {f.designation && f.department && <span style={{ margin: '0 .4rem' }}>·</span>}
                      {f.department && <span>{f.department}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                    {isSubmitted ? (
                      <span className="badge badge-green" style={{ padding: '.4rem .75rem', fontSize: '.84rem' }}>
                        ✓ Completed
                      </span>
                    ) : hasDraft ? (
                      <span className="badge badge-blue" style={{ padding: '.4rem .75rem', fontSize: '.84rem' }}>
                        ● In Progress
                      </span>
                    ) : (
                      <span className="badge badge-slate" style={{ padding: '.4rem .75rem', fontSize: '.84rem', background: '#f1f5f9', color: '#475569' }}>
                        Pending
                      </span>
                    )}

                    {!isSubmitted && (
                      <button
                        type="button"
                        className={`btn btn-sm ${isExpanded ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(f._id);
                        }}
                      >
                        {isExpanded ? 'Collapse ▲' : (hasDraft ? 'Resume Feedback ▼' : 'Give Feedback ▼')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Expansion Form */}
                {isExpanded && !isSubmitted && (
                  <InlineFeedbackForm
                    faculty={f}
                    onSubmitted={handleSubmitted}
                    onDraftStateChange={handleDraftStateChange}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;
