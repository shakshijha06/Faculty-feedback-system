/**
 * components/Navbar.jsx
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="Faculty Feedback System Home">
          Faculty Feedback System
        </Link>
        {user && (
          <div className="navbar-user">
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{user.role}</span>
            <Link to="/change-password" className="btn btn-secondary btn-sm">
              Change Password
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout} aria-label="Log out">
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
