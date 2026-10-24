/**
 * pages/Login.jsx — Institutional Login Page
 *
 * University of Engineering and Management / Institute of Engineering and Management, Kolkata
 * Students log in with Enrollment Number. Admins log in with institutional email.
 * The server determines the role — no client-side role selection.
 */
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="login-page" aria-label="Login page">
      {/* ── Official Institutional Top Header ────────────────────── */}
      <header className="login-top-header" role="banner" aria-label="Institution identity">
        <div className="login-top-header-inner">
          <div className="inst-brand-cluster">
            <div className="inst-logos-group">
              <img
                src="/uem-logo-placeholder.png"
                alt="University of Engineering and Management logo"
                className="inst-header-logo"
              />
              <img
                src="/iem-logo-placeholder.png"
                alt="Institute of Engineering and Management logo"
                className="inst-header-logo"
              />
            </div>
            <div className="inst-titles-stack">
              <h1 className="inst-title-primary">University of Engineering and Management, Kolkata</h1>
              <div className="inst-title-divider" role="separator" />
              <h2 className="inst-title-secondary">Institute of Engineering and Management, Kolkata</h2>
            </div>
          </div>
          <div className="inst-portal-badge">
            <span className="inst-portal-badge-dot" />
            <span>Faculty Feedback Portal</span>
          </div>
        </div>
      </header>

      {/* ── Centered Login Form Area ─────────────────────────────── */}
      <main className="login-body-container">
        <div className="login-card" role="region" aria-label="Login form">
          <div className="login-card-header">
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">Access your academic feedback portal</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">Username / Enrollment No.</label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="Enter enrollment number or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                aria-required="true"
                aria-describedby="identifier-hint"
                autoFocus
              />
             
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
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
              className="btn btn-primary btn-block login-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer-note">
            Forgot your password? Contact your department administrator.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
