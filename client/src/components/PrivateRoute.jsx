/**
 * components/PrivateRoute.jsx
 *
 * Guards protected pages.
 * 1. While auth context is hydrating from localStorage → shows spinner.
 * 2. On mount, calls GET /api/auth/me to verify the stored token is still
 *    valid on the SERVER — catches stale tokens and any mock/bypassed tokens.
 * 3. If token is invalid → clears auth state and redirects to /login.
 * 4. Optional prop: role="admin" | role="student" — enforces role-based access.
 */

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PrivateRoute = ({ role }) => {
  const { user, loading, logout } = useAuth();
  const [verifying, setVerifying] = useState(true);  // true while /api/auth/me is in-flight
  const [serverVerified, setServerVerified] = useState(false);

  useEffect(() => {
    // Skip server verification if context hasn't loaded yet (will re-run after)
    if (loading) return;

    if (!user) {
      setVerifying(false);
      return;
    }

    // Verify token is valid on the server
    api.get('/api/auth/me')
      .then(() => {
        setServerVerified(true);
      })
      .catch(() => {
        // Token is invalid/expired — log the user out and redirect to login
        logout();
        setServerVerified(false);
      })
      .finally(() => setVerifying(false));
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Still hydrating auth context from localStorage
  if (loading || verifying) {
    return (
      <div className="spinner-wrap" role="status" aria-label="Verifying session…">
        <div className="spinner" />
        <span>Verifying session…</span>
      </div>
    );
  }

  // Not logged in
  if (!user || !serverVerified) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch — redirect to own dashboard
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
