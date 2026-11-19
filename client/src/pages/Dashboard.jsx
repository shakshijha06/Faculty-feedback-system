/**
 * pages/Dashboard.jsx — Student Academic Portal Overview
 *
 * Corporate Institutional Design:
 * - Student Profile banner with enrollment, department, semester metadata
 * - Primary Action Cards for Feedback and Award of Excellence nominations
 * - Clean institutional typography and corporate office aesthetics
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquareCheck, Award, KeyRound, LogOut, GraduationCap, Building2, Calendar, FileText } from 'lucide-react';

/**
 * getBatchFromEnrollment
 *
 * Extracts the admission year from a student's enrollment number and
 * returns a "YYYY-YYYY+1" batch string.
 *
 * Enrollment number format: 1<YYYY><remaining digits>
 *   - Position 0    : "1" (fixed prefix)
 *   - Positions 1-4 : 4-digit admission year
 *
 * Examples:
 *   "12024002001236" → "2024-2025"  (prefix "1", year "2024")
 *   "12023002001236" → "2023-2024"  (prefix "1", year "2023")
 *   "12022002001236" → "2022-2023"  (prefix "1", year "2022")
 *   "12021002001236" → "2021-2022"  (prefix "1", year "2021")
 *
 * Returns null when the enrollment number is missing or does not contain
 * a valid 4-digit year at positions 1-4, so callers can show a fallback.
 *
 * NOTE: The semester has absolutely NO effect on the batch. The batch is
 * determined solely by the admission year encoded in the enrollment number.
 */
const getBatchFromEnrollment = (enrollmentNumber) => {
  if (!enrollmentNumber || typeof enrollmentNumber !== 'string') return null;
  // We need at least 5 characters to reach the year digits (index 1-4)
  if (enrollmentNumber.length < 5) return null;
  const yearStr = enrollmentNumber.substring(1, 5);
  const year = parseInt(yearStr, 10);
  // A valid 4-digit year (1900–2099) check
  if (isNaN(year) || year < 1900 || year > 2099) return null;
  return `${year}-${year + 1}`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page">
      <div className="container">
        {/* Profile Banner */}
        <div className="profile-banner">
          <div>
            <div className="profile-banner-name">
              Welcome, {user?.name || 'Student'}
            </div>
            <div className="profile-banner-meta">
              {user?.rollNumber && (
                <span>
                  <GraduationCap size={14} />
                  Enrollment: <strong>{user.rollNumber}</strong>
                </span>
              )}
              {user?.department && (
                <span>
                  <Building2 size={14} />
                  {user.department}
                </span>
              )}
              {user?.semester && (
                <span>
                  <Calendar size={14} />
                  Semester {user.semester}
                </span>
              )}
              {(() => {
                const batch = getBatchFromEnrollment(user?.rollNumber);
                return batch ? (
                  <span>
                    <FileText size={14} />
                    Batch: {batch}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: 'rgba(255,255,255,.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,.3)' }}
              onClick={() => navigate('/change-password')}
            >
              <KeyRound size={14} />
              Change Password
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: 'rgba(255,255,255,.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,.3)' }}
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Section Heading */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '.25rem' }}>
            Academic Evaluation Services
          </h2>
          <p style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>
            Select an action below to participate in institutional evaluations and faculty excellence recognition.
          </p>
        </div>

        {/* Two Primary Action Cards */}
        <div className="grid-2">
          <div className="action-card">
            <div className="action-card-icon" aria-hidden="true">
              <MessageSquareCheck size={24} />
            </div>
            <div className="action-card-title">Submit Semester Feedback</div>
            <div className="action-card-desc">
              Evaluate professors assigned to your department. Review teaching clarity, subject expertise, approachability, and punctuality with 100% cryptographic anonymity.
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => navigate('/feedback-list')}
            >
              Access Faculty Feedback List →
            </button>
          </div>

          <div className="action-card">
            <div className="action-card-icon" aria-hidden="true">
              <Award size={24} />
            </div>
            <div className="action-card-title">Award of Excellence Nomination</div>
            <div className="action-card-desc">
              Nominate exemplary educators for institutional recognition. Submit formal citations highlighting teaching quality, mentorship, and academic leadership.
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => navigate('/nominations')}
            >
              Nominate Faculty Member →
            </button>
          </div>
        </div>

        {/* Institutional Guidelines Notice */}
        <div className="card" style={{ marginTop: '0.5rem', borderLeft: '4px solid var(--clr-primary)' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)' }}>
            Institutional Evaluation Policy & Privacy Protection
          </h3>
          <p style={{ fontSize: '.84rem', color: 'var(--clr-text-secondary)', lineHeight: 1.55 }}>
            Feedback submissions are completely confidential. Student identification numbers are tracked solely to verify participation and prevent multiple submissions; individual numerical scores and written comments are stored without voter links. For queries regarding course allotments, please contact the Academic Administration Office.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
