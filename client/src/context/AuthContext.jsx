/**
 * context/AuthContext.jsx
 *
 * Manages authentication state for the entire app.
 * Stores the JWT token in localStorage and provides:
 *   - user: the logged-in user object (or null)
 *   - token: the JWT string
 *   - login(email, password): calls the API, stores token
 *   - logout(): clears state and token
 *   - loading: true while re-hydrating from localStorage on first load
 *
 * Usage:
 *   import { useAuth } from '../context/AuthContext';
 *   const { user, login, logout } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring from localStorage

  // On first render, restore auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ffs_token');
    const savedUser  = localStorage.getItem('ffs_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Attach the token to all future Axios requests
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  /**
   * login — calls POST /api/auth/login, stores token + user
   * Throws on error so the Login screen can show the message.
   * Returns the user object so the caller can redirect by role.
   */
  const login = async (identifier, password) => {
    const { data } = await api.post('/api/auth/login', { identifier, password });
    const { token: newToken, user: newUser } = data;

    // Persist to localStorage so the session survives page refresh
    localStorage.setItem('ffs_token', newToken);
    localStorage.setItem('ffs_user', JSON.stringify(newUser));

    // Attach token to all future Axios requests
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    setToken(newToken);
    setUser(newUser);
    return newUser; // caller uses this for role-based redirect
  };

  /** logout — clears everything */
  const logout = () => {
    localStorage.removeItem('ffs_token');
    localStorage.removeItem('ffs_user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook for consuming the context */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
