/**
 * pages/FeedbackList.jsx — Interactive Student Faculty Evaluation
 *
 * Professional Corporate Institutional Redesign with Prominent Faculty Search:
 * - Search by Full Name, First Name, Last Name, Timetable Initials (e.g., AKD, A.K.D.), or Partial Matches
 * - Dynamic live filtering as students type with clear button and match counts
 * - Clear display of verified initials badge and full faculty details
 * - Handling multiple faculty matching the same initials
 * - Inline 7-factor evaluation form with autosave, validation, and anonymous submission
 * - Strict student privacy: no voter roll exposure, anonymous feedback decoupling
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import api from '../services/api';
import { FEEDBACK_FACTORS } from '../constants/academicData';
import { matchesFacultySearch, getEffectiveInitials } from '../utils/facultySearch';

const CURRENT_YEAR = '2024-25';

// ── Horizontal 1–5 Radio Rating Component (Segmented Office Style) ───────────
const RadioRating = ({ factorKey, facultyId, value, onChange }) => (
  <div className="radio-rating-group" role="radiogroup" aria-labelledby={`q-label-${factorKey}`}>
    {[1, 2, 3, 4, 5].map(n => (
      <label
        key={n}
        className={`radio-rating-label ${value === n ? 'active' : ''}`}
        htmlFor={`rating-${facultyId}-${factorKey}-${n}`}
        title={`Rate ${n} of 5`}
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
    }, 700);
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
        errs[`${f.key}_score`] = 'Please select a numerical evaluation score (1–5).';
      }
      if (!ratings[f.key]?.reason || ratings[f.key].reason.trim().length < 5) {
        errs[`${f.key}_reason`] = 'Please provide a substantive justification (minimum 5 characters).';
      }
    });

    if (!overallComment || overallComment.trim().length < 10) {
      errs.overallComment = 'Please provide an overall summary comment (minimum 10 characters).';
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
      <div className="spinner-wrap" style={{ padding: '2rem 1rem' }}>
        <div className="spinner" />
        <span>Restoring draft progress from server…</span>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
      {/* Autosave Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ fontSize: '.84rem', color: 'var(--clr-text-secondary)' }}>
          Evaluating: <strong>{faculty.name}</strong> ({faculty.designation || 'Faculty Member'})
        </div>
        <div style={{ fontSize: '.82rem' }}>
          {autosaveStatus === 'saving' && (
            <span style={{ color: 'var(--clr-primary)', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
              <span className="spinner-sm" /> Saving draft…
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span style={{ color: 'var(--clr-success)', display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Draft saved {lastSavedTime ? `(${lastSavedTime})` : ''}
            </span>
          )}
          {autosaveStatus === 'error' && (
            <span style={{ color: 'var(--clr-danger)', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
              <AlertCircle size={14} /> Unable to save draft to server
            </span>
          )}
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.25rem', fontSize: '.84rem' }}>
        <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Cryptographic Anonymity Guarantee:</strong> Your student identity, enrollment number, and session credentials are decoupled from feedback records. Only aggregated averages and anonymous commentary are accessible to administrators.
        </div>
      </div>

      {submitError && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          {submitError}
        </div>
      )}

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
                backgroundColor: idx % 2 === 0 ? 'var(--clr-surface)' : 'var(--clr-surface-alt)',
                border: hasScoreErr || hasReasonErr ? '1px solid var(--clr-danger)' : '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.15rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem', marginBottom: '.65rem' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label id={`q-label-${f.key}`} style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--clr-text)', display: 'block' }}>
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
              <div style={{ marginTop: '.65rem' }}>
                <label htmlFor={`reason-${faculty._id}-${f.key}`} className="form-label" style={{ fontSize: '.78rem', marginBottom: '.25rem' }}>
                  Specific Evaluation Justification <span style={{ color: 'var(--clr-danger)' }}>*</span> (minimum 5 characters)
                </label>
                <textarea
                  id={`reason-${faculty._id}-${f.key}`}
                  className="form-input"
                  rows={2}
                  placeholder={`Explain your score for ${f.label.toLowerCase()}…`}
                  value={currentRating.reason}
                  onChange={e => handleReasonChange(f.key, e.target.value)}
                  style={{ fontSize: '.86rem', resize: 'vertical' }}
                />
                {hasReasonErr && <p className="form-error">{errors[`${f.key}_reason`]}</p>}
              </div>
            </div>
          );
        })}

        {/* Overall Written Comment (Mandatory) */}
        <div
          style={{
            backgroundColor: 'var(--clr-surface)',
            border: errors.overallComment ? '1px solid var(--clr-danger)' : '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <label htmlFor={`overall-${faculty._id}`} style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--clr-text)', display: 'block', marginBottom: '.25rem' }}>
            Overall Academic Feedback <span style={{ color: 'var(--clr-danger)' }}>*</span>
          </label>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', marginBottom: '.65rem' }}>
            Summarize course learning outcomes, instructional quality, and constructive recommendations (minimum 10 characters).
          </p>
          <textarea
            id={`overall-${faculty._id}`}
            className="form-input"
            rows={3}
            placeholder="Provide your constructive summary review here…"
            value={overallComment}
            onChange={e => handleOverallChange(e.target.value)}
            style={{ fontSize: '.86rem', resize: 'vertical' }}
          />
          {errors.overallComment && <p className="form-error">{errors.overallComment}</p>}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>
            All inputs are autosaved to server drafts in real time.
          </span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '180px' }}
          >
            {submitting ? 'Submitting Review…' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main Feedback List Page with Search & Inline Expansion ───────────────────
const FeedbackList = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMap, setStatusMap] = useState({});
  const [expandedFacultyId, setExpandedFacultyId] = useState(null);
  const [submittedSuccessMsg, setSubmittedSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch department faculty and their submission/draft status
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get('/api/faculty/my-department');
        if (!isMounted) return;
        const list = data.data || [];
        setFaculty(list);

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

  // Dynamic search filtering supporting name, initials, and timetable abbreviations
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return faculty;
    return faculty.filter(f => matchesFacultySearch(f, searchQuery));
  }, [faculty, searchQuery]);

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
    setSubmittedSuccessMsg(`Feedback for ${facultyMember?.name || 'the faculty member'} has been recorded anonymously.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [faculty]);

  if (loading) {
    return (
      <div className="spinner-wrap" role="status">
        <div className="spinner" />
        <span>Loading academic faculty directory…</span>
      </div>
    );
  }

  const completedCount = Object.values(statusMap).filter(s => s.submitted).length;
  const inProgressCount = Object.values(statusMap).filter(s => !s.submitted && s.hasDraft).length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 880 }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Semester Faculty Feedback</h1>
            <p className="page-subtitle">
              Academic Term {CURRENT_YEAR} · Evaluated: <strong>{completedCount} of {faculty.length}</strong> faculty members
              {inProgressCount > 0 && <span style={{ marginLeft: '.5rem', color: 'var(--clr-info)' }}>({inProgressCount} in progress)</span>}
            </p>
          </div>
        </div>

        {submittedSuccessMsg && (
          <div className="alert alert-success" role="status">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{submittedSuccessMsg}</div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* ── Prominent Faculty Search Bar ────────────────────────────── */}
        <div className="directory-search-bar" role="search">
          <Search size={18} className="directory-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="directory-search-input"
            placeholder="Search faculty by name or initials (e.g., Anirban Das, AKD, A.K.D.)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search faculty by name or timetable initials"
          />
          {searchQuery && (
            <button
              type="button"
              className="directory-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <span className="directory-match-counter">
            {filteredFaculty.length} of {faculty.length} {filteredFaculty.length === 1 ? 'Faculty' : 'Faculty'}
          </span>
        </div>

        {/* Empty State when Search Yields Zero Matches */}
        {!error && filteredFaculty.length === 0 && (
          <div className="search-empty-state">
            <div className="search-empty-title">No Faculty Members Found</div>
            <p className="search-empty-desc">
              No faculty member matches <strong>"{searchQuery}"</strong>. You can search by full name (e.g. <em>Anirban Das</em>), first name, last name, or timetable initials (e.g. <em>AKD</em>, <em>A.K.D.</em>).
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
            >
              Clear Search Filter
            </button>
          </div>
        )}

        {/* Faculty List Directory with Inline Expandable Evaluations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredFaculty.map(f => {
            const isSubmitted = statusMap[f._id]?.submitted;
            const hasDraft = statusMap[f._id]?.hasDraft;
            const isExpanded = expandedFacultyId === f._id;
            const initials = getEffectiveInitials(f);

            return (
              <div
                key={f._id}
                className="card"
                style={{
                  padding: '1.15rem 1.35rem',
                  marginBottom: 0,
                  borderColor: isExpanded ? 'var(--clr-primary)' : 'var(--clr-border)',
                  backgroundColor: isExpanded ? 'var(--clr-surface)' : 'var(--clr-surface)',
                  boxShadow: isExpanded ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
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
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.02rem', color: 'var(--clr-text)' }}>
                        {f.name}
                      </h3>
                      {initials && (
                        <span
                          className="badge badge-blue"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em',
                            fontSize: '.74rem',
                            fontWeight: 700,
                          }}
                          title="Timetable Initials / Routine Abbreviation"
                        >
                          Initials: {initials}
                        </span>
                      )}
                      {f.employeeId && (
                        <span style={{ fontSize: '.75rem', color: 'var(--clr-text-muted)', background: 'var(--clr-surface-alt)', padding: '.15rem .45rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--clr-border)' }}>
                          ID: {f.employeeId}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', marginTop: '.25rem' }}>
                      {f.designation && <span>{f.designation}</span>}
                      {f.designation && f.department && <span style={{ margin: '0 .4rem' }}>·</span>}
                      {f.department && <span>{f.department}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexShrink: 0 }}>
                    {isSubmitted ? (
                      <span className="badge badge-green">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    ) : hasDraft ? (
                      <span className="badge badge-blue">
                        <Clock size={13} /> In Progress
                      </span>
                    ) : (
                      <span className="badge badge-slate">
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
                        {isExpanded ? (
                          <>Collapse <ChevronUp size={14} /></>
                        ) : hasDraft ? (
                          <>Resume Feedback <ChevronDown size={14} /></>
                        ) : (
                          <>Evaluate Faculty <ChevronDown size={14} /></>
                        )}
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
