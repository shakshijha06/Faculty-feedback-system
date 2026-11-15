/**
 * pages/FeedbackForm.jsx — Faculty Evaluation Form (Standalone Route)
 *
 * Route: /feedback/:facultyId
 *
 * Professional corporate styling with draft preservation, 
 * evaluation ratings, mandatory justifications, review step, and submission.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Lock, Save, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const CURRENT_YEAR = '2024-25';

const QUESTIONS = [
  { key: 'teaching_clarity',  label: 'Teaching Clarity & Explanation',  desc: 'How clearly does the faculty explain concepts?' },
  { key: 'subject_expertise', label: 'Subject Expertise & Knowledge',   desc: 'How thoroughly does the faculty demonstrate subject mastery?' },
  { key: 'approachability',   label: 'Approachability & Support',       desc: 'Is the faculty accessible and helpful outside class?' },
  { key: 'class_preparation', label: 'Lecture Preparation & Materials', desc: 'How well prepared are the lectures and study resources?' },
  { key: 'overall',           label: 'Overall Teaching Effectiveness',  desc: 'Your overall rating of instructional quality.' },
];

const initRatings = () =>
  Object.fromEntries(QUESTIONS.map(q => [q.key, { score: 0, reason: '' }]));

// ── Horizontal Segmented 1–5 Rating Control ──────────────────────────────────
const SegmentedRating = ({ id, value, onChange }) => (
  <div className="radio-rating-group" role="radiogroup" aria-labelledby={`q-label-${id}`}>
    {[1, 2, 3, 4, 5].map(n => (
      <label
        key={n}
        className={`radio-rating-label ${value === n ? 'active' : ''}`}
        htmlFor={`rating-${id}-${n}`}
        title={`Rate ${n} of 5`}
      >
        <input
          type="radio"
          id={`rating-${id}-${n}`}
          name={`rating-${id}`}
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

const FeedbackForm = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [ratings, setRatings] = useState(initRatings());
  const [positiveComment, setPositiveComment] = useState('');
  const [improvementComment, setImprovementComment] = useState('');
  const [errors, setErrors] = useState({});
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
        /* start clean */
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [facultyId]);

  const setScore = (key, score) => {
    setRatings(p => ({ ...p, [key]: { ...p[key], score } }));
    if (errors[`${key}_score`]) setErrors(p => ({ ...p, [`${key}_score`]: null }));
  };

  const setReason = (key, reason) => {
    setRatings(p => ({ ...p, [key]: { ...p[key], reason } }));
    if (errors[`${key}_reason`]) setErrors(p => ({ ...p, [`${key}_reason`]: null }));
  };

  const validate = () => {
    const errs = {};
    QUESTIONS.forEach(q => {
      if (!ratings[q.key].score) errs[`${q.key}_score`] = 'Please select a score from 1 to 5.';
      if (!ratings[q.key].reason || ratings[q.key].reason.trim().length < 5)
        errs[`${q.key}_reason`] = 'Please provide an explanation of at least 5 characters.';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    setDraftSaved(false);
    try {
      const payloadRatings = QUESTIONS.map(q => ({
        questionKey: q.key,
        label: q.label,
        score: ratings[q.key].score,
        reason: ratings[q.key].reason,
      }));
      await api.post(`/api/feedback/draft/${facultyId}`, {
        ratings: payloadRatings,
        positiveComment,
        improvementComment,
        academicYear: CURRENT_YEAR,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      /* silent */
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payloadRatings = QUESTIONS.map(q => ({
        questionKey: q.key,
        label: q.label,
        score: ratings[q.key].score,
        reason: ratings[q.key].reason.trim(),
      }));
      await api.post('/api/feedback/submit', {
        facultyId,
        ratings: payloadRatings,
        positiveComment: positiveComment.trim(),
        improvementComment: improvementComment.trim(),
        academicYear: CURRENT_YEAR,
      });
      setStep(3);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please check your answers and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" /> Loading faculty evaluation…
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 600 }}>
          <button className="btn-back" onClick={() => navigate('/feedback-list')}>← Back to Faculty List</button>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--clr-success-bg)', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={24} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)' }}>
              Feedback Already Submitted
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem' }}>
              You have already evaluated {faculty?.name || 'this faculty member'} for Academic Term {CURRENT_YEAR}. Submissions cannot be modified once committed.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/feedback-list')}>
              Return to Faculty List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 3) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--clr-success-bg)', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)' }}>
              Evaluation Recorded Anonymously
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Thank you. Your feedback for <strong>{faculty?.name}</strong> has been registered. Your student credentials remain decoupled from these evaluation metrics.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/feedback-list')}>
              Return to Faculty List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Review Screen
  if (step === 2) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Review Feedback — {faculty?.name}</h1>
              <p className="page-subtitle">Verify your ratings and written remarks before final commitment.</p>
            </div>
          </div>

          {submitError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} /> <div>{submitError}</div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--clr-text)' }}>
              Rating Criteria Summary
            </h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Evaluation Criterion</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Score</th>
                    <th>Reason / Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map(q => (
                    <tr key={q.key}>
                      <td style={{ fontWeight: 600 }}>{q.label}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-blue">{ratings[q.key].score} / 5</span>
                      </td>
                      <td style={{ fontSize: '.84rem', color: 'var(--clr-text-secondary)' }}>{ratings[q.key].reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(positiveComment || improvementComment) && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--clr-text)' }}>
                Additional Commentary
              </h3>
              {positiveComment && (
                <div style={{ marginBottom: '.75rem' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Strengths:</div>
                  <p style={{ fontSize: '.86rem', color: 'var(--clr-text)' }}>{positiveComment}</p>
                </div>
              )}
              {improvementComment && (
                <div>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Recommendations:</div>
                  <p style={{ fontSize: '.86rem', color: 'var(--clr-text)' }}>{improvementComment}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={submitting}>
              <ArrowLeft size={15} /> Edit Answers
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: '180px' }}>
              {submitting ? 'Committing…' : 'Confirm & Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Rating form
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button className="btn-back" onClick={() => navigate('/feedback-list')}>← Back to Faculty List</button>

        {faculty && (
          <div className="page-header">
            <div>
              <h1 className="page-title">Feedback — {faculty.name}</h1>
              <p className="page-subtitle">
                {faculty.designation}{faculty.designation && faculty.department ? ' · ' : ''}{faculty.department}
              </p>
            </div>
          </div>
        )}

        <div className="alert alert-info">
          <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            This evaluation is <strong>confidential and anonymous</strong>. Your responses are not linked to your student profile.
            {draftSaved && <span style={{ marginLeft: '.5rem', color: 'var(--clr-success)', fontWeight: 600 }}>✓ Draft saved.</span>}
          </div>
        </div>

        {QUESTIONS.map((q, idx) => (
          <div key={q.key} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem', marginBottom: '.65rem' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label id={`q-label-${q.key}`} style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--clr-text)' }}>
                  {idx + 1}. {q.label} <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', marginTop: '.15rem' }}>{q.desc}</p>
              </div>
              <SegmentedRating id={q.key} value={ratings[q.key].score} onChange={v => setScore(q.key, v)} />
            </div>

            {errors[`${q.key}_score`] && <p className="form-error" style={{ marginBottom: '.5rem' }}>{errors[`${q.key}_score`]}</p>}

            <div className="form-group" style={{ marginTop: '.65rem', marginBottom: 0 }}>
              <label htmlFor={`reason-${q.key}`} className="form-label" style={{ fontSize: '.78rem' }}>
                Evaluation Reason <span style={{ color: 'var(--clr-danger)' }}>*</span> (min 5 characters)
              </label>
              <textarea
                id={`reason-${q.key}`}
                className="form-input"
                rows={2}
                placeholder="Explain why you gave this rating…"
                value={ratings[q.key].reason}
                onChange={e => setReason(q.key, e.target.value)}
                style={{ fontSize: '.86rem', resize: 'vertical' }}
              />
              {errors[`${q.key}_reason`] && <p className="form-error">{errors[`${q.key}_reason`]}</p>}
            </div>
          </div>
        ))}

        {/* Optional global comments */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--clr-text)' }}>
            Qualitative Commentary (Optional)
          </h3>
          <div className="form-group">
            <label htmlFor="pos-comment" className="form-label">Key Strengths &amp; Commendations</label>
            <textarea
              id="pos-comment"
              className="form-input"
              rows={2}
              placeholder="What teaching aspects were most effective?"
              value={positiveComment}
              onChange={e => setPositiveComment(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="imp-comment" className="form-label">Constructive Recommendations</label>
            <textarea
              id="imp-comment"
              className="form-input"
              rows={2}
              placeholder="What could be enhanced in upcoming terms?"
              value={improvementComment}
              onChange={e => setImprovementComment(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSaveDraft}
            disabled={draftSaving}
          >
            <Save size={15} /> {draftSaving ? 'Saving Draft…' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ minWidth: '180px' }}>
            Review Answers <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
