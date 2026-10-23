/**
 * pages/FeedbackList.jsx — Faculty list for feedback submission
 *
 * Route: /feedback-list
 * Loads all active faculty from the student's department via:
 *   GET /api/faculty/my-department
 *
 * For each faculty, checks submission status and shows the appropriate action.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CURRENT_YEAR = '2024-25';

const FeedbackList = () => {
  const navigate = useNavigate();
  const [faculty,       setFaculty]       = useState([]);
  const [statusMap,     setStatusMap]     = useState({});  // facultyId → hasSubmitted
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/faculty/my-department');
        const list = data.data || [];
        setFaculty(list);

        // Fetch submission status for each faculty member in parallel
        const results = await Promise.allSettled(
          list.map(f => api.get(`/api/feedback/status/${f._id}?year=${CURRENT_YEAR}`))
        );
        const map = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            map[list[i]._id] = r.value.data.hasSubmitted;
          }
        });
        setStatusMap(map);
      } catch (err) {
        setError(err.message || 'Failed to load faculty list.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /> Loading faculty…</div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        <h1 className="page-title">Submit Semester Feedback</h1>
        <p className="page-subtitle">
          Select a faculty member to provide your feedback for the {CURRENT_YEAR} academic year.
        </p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {!error && faculty.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', color: 'var(--clr-text-muted)' }}>👨‍🏫</div>
            <p style={{ fontWeight: 600, marginBottom: '.4rem' }}>No faculty members found</p>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '.9rem' }}>
              No active faculty are registered for your department yet. Contact your administrator.
            </p>
          </div>
        )}

        {faculty.map(f => {
          const submitted = statusMap[f._id];
          return (
            <div key={f._id} className="faculty-card">
              <div className="faculty-card-info">
                <div className="faculty-card-name">{f.name}</div>
                <div className="faculty-card-sub">
                  {f.designation && <span>{f.designation}</span>}
                  {f.designation && f.department && <span style={{ margin: '0 .4rem', color: 'var(--clr-border)' }}>·</span>}
                  {f.department && <span>{f.department}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                {submitted
                  ? <span className="badge badge-green">Submitted</span>
                  : <span className="badge badge-yellow">Pending</span>
                }
                {submitted ? (
                  <button className="btn btn-secondary btn-sm" disabled>
                    Already Submitted
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/feedback/${f._id}`)}
                  >
                    Give Feedback
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeedbackList;
