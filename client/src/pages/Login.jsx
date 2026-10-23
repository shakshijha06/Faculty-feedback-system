/**
 * pages/Login.jsx — Institutional Login Page
 *
 * University of Engineering and Management / Institute of Engineering and Management, Kolkata
 * Students log in with Enrollment Number. Admins log in with institutional email.
 * The server determines the role — no client-side role selection.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" aria-label="Login page">
      <div className="login-wrapper">

        {/* Institutional header */}
        <header className="inst-header" aria-label="Institution identity">
          <img
            src="/uem-logo-placeholder.png"
            alt="University of Engineering and Management logo"
            className="inst-logo"
          />
          <div className="inst-names">
            <span className="inst-name-upper">University of Engineering and Management, Kolkata</span>
            <div className="inst-divider" role="separator" />
            <span className="inst-name-lower">Institute of Engineering and Management, Kolkata</span>
          </div>
          <img
            src="/iem-logo-placeholder.png"
            alt="Institute of Engineering and Management logo"
            className="inst-logo"
          />
        </header>

        {/* Login card */}
        <div className="login-card" role="region" aria-label="Login form">
          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Faculty Feedback Portal</p>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">Username</label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder=""
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                aria-required="true"
                aria-describedby="identifier-hint"
                autoFocus
              />
              <p id="identifier-hint" className="form-hint">
                Enter your college enrollment number or institutional email address.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  className="btn-show-pass"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block login-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer-note">
            Forgot your password? Contact your administrator.
          </p>
        </div>

      </div>
    </main>
  );
};

export default Login;
