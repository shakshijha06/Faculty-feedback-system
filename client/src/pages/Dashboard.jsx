/**
 * pages/Dashboard.jsx — Student Home Page
 *
 * Shows:
 *   1. Profile banner: name, enrollment no., department, semester
 *   2. Two primary action cards: Give Feedback | Nominate Faculty
 *
 * No stat cards. No assignment list. Clean two-card design per spec.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page">
      <div className="container">

        {/* Profile banner */}
        <div className="profile-banner">
          <div>
            <div className="profile-banner-name">
              Welcome, {user?.name || 'Student'}
            </div>
            <div className="profile-banner-meta">
              {user?.rollNumber && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
                  {user.rollNumber}
                </span>
              )}
              {user?.department && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  {user.department}
                </span>
              )}
              {user?.semester && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Semester {user.semester}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Two action cards */}
        <div className="grid-2">

          <div className="action-card">
            <div className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div className="action-card-title">Submit Semester Feedback</div>
            <div className="action-card-desc">
              Give feedback on the faculty members relevant to your semester and department.
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: '.5rem' }}
              onClick={() => navigate('/feedback-list')}
            >
              Give Feedback
            </button>
          </div>

          <div className="action-card">
            <div className="action-card-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div className="action-card-title">Nominate Faculty</div>
            <div className="action-card-desc">
              Nominate eligible faculty members for the Award of Excellence.
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: '.5rem' }}
              onClick={() => navigate('/nominations')}
            >
              Nominate Faculty
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
