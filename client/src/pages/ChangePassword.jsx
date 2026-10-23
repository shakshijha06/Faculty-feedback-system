/**
 * pages/ChangePassword.jsx
 *
 * Allows any authenticated user (student or admin) to change their password.
 * Verifies current password on the server before accepting the new one.
 * PUT /api/auth/change-password
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]       = useState('');
  const [confirmPassword,  setConfirmPassword]   = useState('');
  const [showCurrent,      setShowCurrent]       = useState(false);
  const [showNew,          setShowNew]           = useState(false);
  const [loading,          setLoading]           = useState(false);
  const [error,            setError]             = useState('');
  const [success,          setSuccess]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.'); return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.'); return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      // Clear forms
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Password change failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 500 }}>
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Your new password must be at least 6 characters.</p>

        <div className="card">
          {success && (
            <div className="alert alert-success" role="status">
              Password changed successfully. Use your new password next time you log in.
            </div>
          )}
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="current-pwd" className="form-label">Current Password</label>
              <div className="input-password-wrap">
                <input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-required="true"
                />
                <button type="button" className="btn-show-pass"
                  onClick={() => setShowCurrent(v => !v)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}>
                  {showCurrent ? '🙈' : '👁'}
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
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-required="true"
                />
                <button type="button" className="btn-show-pass"
                  onClick={() => setShowNew(v => !v)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}>
                  {showNew ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-pwd" className="form-label">Confirm New Password</label>
              <input
                id="confirm-pwd"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-required="true"
              />
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
