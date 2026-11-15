/**
 * pages/ChangePassword.jsx — User Security & Password Management
 *
 * Allows authenticated students and administrators to update account credentials.
 * Server verifies current password before updating to new one.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Password update failed. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 540 }}>
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="page-header">
          <div>
            <h1 className="page-title">Account Security</h1>
            <p className="page-subtitle">Update your account access password</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--clr-border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--clr-primary-subtle)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--clr-text)' }}>Change Password</h2>
              <p style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)', margin: 0 }}>Password must be at least 6 characters in length</p>
            </div>
          </div>

          {success && (
            <div className="alert alert-success" role="status">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>Password updated successfully. Please use your new password for future sign-ins.</div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="current-pwd" className="form-label">Current Password</label>
              <div className="input-password-wrap">
                <input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your existing password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  className="btn-show-pass"
                  onClick={() => setShowCurrent(v => !v)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-pwd" className="form-label">New Password</label>
              <div className="input-password-wrap">
                <input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your new password (min. 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  className="btn-show-pass"
                  onClick={() => setShowNew(v => !v)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                >
                  {showNew ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-pwd" className="form-label">Confirm New Password</label>
              <input
                id="confirm-pwd"
                type="password"
                className="form-input"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-required="true"
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading}
              style={{ marginTop: '.75rem' }}
            >
              {loading ? 'Updating Password…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
