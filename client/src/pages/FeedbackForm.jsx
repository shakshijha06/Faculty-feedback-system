/**
 * pages/FeedbackForm.jsx — Faculty-based anonymous feedback with draft support
 *
 * Route: /feedback/:facultyId
 *
 * Flow:
 *   1. Load faculty info + check if already submitted
 *   2. Load saved draft (if any)
 *   3. Student rates each factor 1–5 and provides a mandatory reason
 *   4. "Save Draft" persists progress to MongoDB
 *   5. "Review" → Step 2 (review screen)
 *   6. Submit → POST /api/feedback/submit → Step 3 (success)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CURRENT_YEAR = '2024-25';

const QUESTIONS = [
  { key: 'teaching_clarity',  label: 'Teaching Clarity',  desc: 'How clearly does the faculty explain concepts?' },
  { key: 'subject_expertise', label: 'Subject Expertise', desc: 'How well does the faculty know the subject?' },
  { key: 'approachability',   label: 'Approachability',   desc: 'Is the faculty approachable and helpful outside class?' },
  { key: 'class_preparation', label: 'Class Preparation', desc: 'How well prepared are the lectures and materials?' },
  { key: 'overall',           label: 'Overall Impression',desc: 'Your overall impression of this faculty member.' },
];

const initRatings = () =>
  Object.fromEntries(QUESTIONS.map(q => [q.key, { score: 0, reason: '' }]));

// ── Star rating control ───────────────────────────────────────────────────────
const StarRating = ({ id, value, onChange }) => (
  <div className="star-row" role="group" aria-labelledby={`q-label-${id}`}>
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        className={`star-btn ${n <= value ? 'star-filled' : 'star-empty'}`}
        onClick={() => onChange(n)}
        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        aria-pressed={n === value}
      >★</button>
    ))}
    {value > 0 && <span className="star-label">{value}/5</span>}
  </div>
);

const FeedbackForm = () => {
  const { facultyId } = useParams();
  const navigate       = useNavigate();

  const [step, setStep]               = useState(1);
  const [faculty, setFaculty]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [ratings, setRatings]                   = useState(initRatings());
  const [positiveComment, setPositiveComment]   = useState('');
  const [improvementComment, setImprovementComment] = useState('');
  const [errors, setErrors]                     = useState({});
  const [draftSaving, setDraftSaving]           = useState(false);
  const [draftSaved, setDraftSaved]             = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState('');

  // Load faculty info, submission status, and draft in parallel
  useEffect(() => {
    const init = async () => {
      try {
        const [facultyRes, statusRes, draftRes] = await Promise.all([
          api.get(`/api/faculty/${facultyId}`),
          api.get(`/api/feedback/status/${facultyId}?year=${CURRENT_YEAR}`),
          api.get(`/api/feedback/draft/${facultyId}?year=${CURRENT_YEAR}`),
        ]);
        setFaculty(facultyRes.data.data);
        if (statusRes.data.hasSubmitted) {
          setAlreadySubmitted(true);
        } else if (draftRes.data.data) {
          // Restore draft
          const d = draftRes.data.data;
          if (d.ratings?.length) {
            const restored = initRatings();
            d.ratings.forEach(r => {
              if (restored[r.questionKey] !== undefined) {
                restored[r.questionKey] = { score: r.score || 0, reason: r.reason || '' };
              }
            });
            setRatings(restored);
          }
          setPositiveComment(d.positiveComment || '');
          setImprovementComment(d.improvementComment || '');
        }
      } catch {
        /* silent — show empty form */
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [facultyId]);

  const setScore  = (key, score)  => setRatings(p => ({ ...p, [key]: { ...p[key], score } }));
  const setReason = (key, reason) => setRatings(p => ({ ...p, [key]: { ...p[key], reason } }));

  // Save draft to server
  const handleSaveDraft = useCallback(async () => {
    setDraftSaving(true);
    setDraftSaved(false);
    try {
      const ratingsPayload = QUESTIONS.map(q => ({
        questionKey: q.key, label: q.label,
        score: ratings[q.key].score,
        reason: ratings[q.key].reason,
      }));
      await api.post(`/api/feedback/draft/${facultyId}`, {
        ratings: ratingsPayload,
        positiveComment, improvementComment,
        academicYear: CURRENT_YEAR,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch { /* silent */ }
    finally { setDraftSaving(false); }
  }, [facultyId, ratings, positiveComment, improvementComment]);

  const validateStep1 = () => {
    const errs = {};
    QUESTIONS.forEach(q => {
      if (!ratings[q.key].score)
        errs[`${q.key}_score`] = 'Please select a rating.';
      if (!ratings[q.key].reason || ratings[q.key].reason.trim().length < 5)
        errs[`${q.key}_reason`] = 'Please write at least 5 characters.';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post('/api/feedback/submit', {
        facultyId,
        academicYear: CURRENT_YEAR,
        ratings: QUESTIONS.map(q => ({
          questionKey: q.key, label: q.label,
          score: ratings[q.key].score,
          reason: ratings[q.key].reason.trim(),
        })),
        positiveComment:    positiveComment.trim()    || undefined,
        improvementComment: improvementComment.trim() || undefined,
      });
      setStep(3);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" />Loading…</div>;

  // Already submitted
  if (alreadySubmitted) return (
    <div className="page"><div className="container" style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Already Submitted</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
          You have already submitted feedback for {faculty?.name || 'this faculty member'}.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/feedback-list')}>Back to Faculty List</button>
      </div>
    </div></div>
  );

  // Step 3: Success
  if (step === 3) return (
    <div className="page"><div className="container" style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--clr-success)' }}>✓</div>
        <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Feedback Submitted</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
          Thank you. Your response has been recorded for <strong>{faculty?.name}</strong>.
        </p>
        <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          Your identity is <strong>not linked</strong> to your answers. Faculty see only aggregate scores.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/feedback-list')}>Back to Faculty List</button>
      </div>
    </div></div>
  );

  // Step 2: Review
  if (step === 2) return (
    <div className="page"><div className="container" style={{ maxWidth: 680 }}>
      <button className="btn-back" onClick={() => setStep(1)}>← Edit responses</button>
      <h1 className="page-title">Review Your Feedback</h1>
      <p className="page-subtitle">Review before submitting. You cannot change answers after submission.</p>
      {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Ratings &amp; Reasons</h3>
        {QUESTIONS.map(q => (
          <div key={q.key} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--clr-border)' }}>
            <p style={{ fontWeight: 600, marginBottom: '.3rem' }}>{q.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', marginBottom: '.3rem' }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize: '1.2rem', color: n <= ratings[q.key].score ? '#f59e0b' : '#d1d5db' }}>★</span>
              ))}
              <span style={{ marginLeft: '.5rem', fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>{ratings[q.key].score}/5</span>
            </div>
            <p style={{ fontSize: '.88rem', color: 'var(--clr-text)', fontStyle: 'italic' }}>"{ratings[q.key].reason}"</p>
          </div>
        ))}
        {positiveComment && (
          <div style={{ marginBottom: '.75rem' }}>
            <p style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--clr-text-muted)', marginBottom: '.25rem' }}>WHAT YOU APPRECIATED</p>
            <p style={{ fontSize: '.9rem' }}>{positiveComment}</p>
          </div>
        )}
        {improvementComment && (
          <div>
            <p style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--clr-text-muted)', marginBottom: '.25rem' }}>SUGGESTIONS</p>
            <p style={{ fontSize: '.9rem' }}>{improvementComment}</p>
          </div>
        )}
        <div className="alert alert-info" style={{ marginTop: '1rem', marginBottom: 0 }}>
          Submitting is <strong>anonymous</strong> — your name is not attached to these responses.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => setStep(1)}>← Go Back</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Anonymously'}
        </button>
      </div>
    </div></div>
  );

  // Step 1: Rating form
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <button className="btn-back" onClick={() => navigate('/feedback-list')}>← Back to Faculty List</button>
        {faculty && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h1 className="page-title" style={{ marginBottom: '.2rem' }}>Feedback — {faculty.name}</h1>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.9rem' }}>
              {faculty.designation}{faculty.designation && faculty.department ? ' · ' : ''}{faculty.department}
            </p>
          </div>
        )}
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          This feedback is <strong>anonymous</strong>. Your name will not be linked to your responses.
          {draftSaved && <strong style={{ marginLeft: '.5rem', color: 'var(--clr-success)' }}>Draft saved.</strong>}
        </div>

        {QUESTIONS.map(q => (
          <div key={q.key} className="card" style={{ marginBottom: '1rem' }}>
            <p id={`q-label-${q.key}`} style={{ fontWeight: 700, marginBottom: '.15rem' }}>{q.label}</p>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.83rem', marginBottom: '.75rem' }}>{q.desc}</p>
            <StarRating id={q.key} value={ratings[q.key].score} onChange={v => setScore(q.key, v)} />
            {errors[`${q.key}_score`] && <p className="form-error">{errors[`${q.key}_score`]}</p>}

            <div className="form-group" style={{ marginTop: '.75rem', marginBottom: 0 }}>
              <label htmlFor={`reason-${q.key}`} className="form-label">
                Reason <span style={{ color: 'var(--clr-danger)' }}>*</span>
                <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)', marginLeft: '.4rem' }}>(min 5 characters)</span>
              </label>
              <textarea
                id={`reason-${q.key}`}
                className="form-input"
                rows={2}
                placeholder="Briefly explain your rating…"
                value={ratings[q.key].reason}
                onChange={e => setReason(q.key, e.target.value)}
              />
              {errors[`${q.key}_reason`] && <p className="form-error">{errors[`${q.key}_reason`]}</p>}
            </div>
          </div>
        ))}

        {/* Optional global comments */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Additional Comments (Optional)</h3>
          <div className="form-group">
            <label htmlFor="pos-comment" className="form-label">What did you appreciate most?</label>
            <textarea id="pos-comment" className="form-input" rows={3}
              value={positiveComment} onChange={e => setPositiveComment(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="imp-comment" className="form-label">What could be improved?</label>
            <textarea id="imp-comment" className="form-input" rows={3}
              value={improvementComment} onChange={e => setImprovementComment(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSaveDraft}
            disabled={draftSaving}
            style={{ whiteSpace: 'nowrap' }}
          >
            {draftSaving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn btn-primary btn-block" onClick={handleNext}>
            Review Answers →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
