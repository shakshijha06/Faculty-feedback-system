/**
 * pages/Login.jsx — Official Institutional Portal Login
 *
 * University of Engineering & Management (UEM) & Institute of Engineering & Management (IEM), Kolkata
 * Students authenticate with Enrollment Number; Administrators with Institutional Email.
 * Server auto-detects user role and issues signed token.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your enrollment number / email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" aria-label="Official Institutional Login Page">
      {/* ── Official Institutional Top Header ────────────────────── */}
      <header className="login-top-header" role="banner" aria-label="Institution identity">
        <div className="login-top-header-inner">
          <div className="inst-brand-cluster">
            <div className="inst-logos-group">
              <img
                src="/uem-logo-placeholder.png"
                alt="University of Engineering and Management (UEM) Kolkata Logo"
                className="inst-header-logo"
              />
              <img
                src="/iem-logo-placeholder.png"
                alt="Institute of Engineering and Management (IEM) Kolkata Logo"
                className="inst-header-logo"
              />
            </div>
            <div className="inst-titles-stack">
              <h1 className="inst-title-primary">University of Engineering &amp; Management, Kolkata</h1>
              <div className="inst-title-divider" role="separator" />
              <h2 className="inst-title-secondary">Institute of Engineering &amp; Management, Kolkata</h2>
            </div>
          </div>
          <div className="inst-portal-badge">
            <span className="inst-portal-badge-dot" />
            <span>Faculty Feedback Portal</span>
          </div>
        </div>
      </header>

      {/* ── Centered Corporate Sign-In Form ──────────────────────── */}
      <main className="login-body-container">
        <div className="login-card" role="region" aria-label="Sign-in form card">
          <div className="login-card-header">
            <h2 className="login-title">Institutional Sign In</h2>
            <p className="login-subtitle">Access your academic feedback &amp; evaluation portal</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                Enrollment Number / Institutional Email
              </label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="e.g. 1202200201001 or admin@uem.edu.in"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                aria-required="true"
                autoFocus
              />
              <p className="form-hint">
                Students enter university enrollment number; administrators enter institutional email.
              </p>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="form-label">Password</label>
              </div>
              <div className="input-password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  className="btn-show-pass"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  aria-pressed={showPass}
                >
                  {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '0.75rem', padding: '0.65rem 1rem' }}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Authenticating…' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="login-footer-note">
            Need password assistance or account recovery? Please contact your departmental academic administrator.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
