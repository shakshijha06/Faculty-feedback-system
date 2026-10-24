/**
 * components/Navbar.jsx — Institutional Responsive Navigation & Sidebar Layout
 *
 * Features:
 * - Persistent left sidebar on desktop (>= 960px).
 * - Automatic collapse on narrow viewports / zoom (< 960px).
 * - Top-left hamburger button toggling an accessible slide-over drawer.
 * - Closes on backdrop click, route selection, or Escape key.
 * - Admin navigation with collapsible Award of Excellence submenu.
 * - Student navigation with dashboard, feedback, and nominations.
 * - Dedicated account section with Change Password and Logout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  MessageSquareCheck,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [awardsMenuOpen, setAwardsMenuOpen] = useState(true);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [drawerOpen]);

  if (!user) return null;

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavClick = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const currentSub = searchParams.get('sub') || 'cycles';

  const isAdmin = user.role === 'admin';

  return (
    <>
      {/* ── Top Bar (Mobile / Zoom Header with Hamburger) ───────────────── */}
      <header className="app-topbar">
        <div className="app-topbar-left">
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={drawerOpen}
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
          <div className="topbar-branding">
            <span className="topbar-title">Faculty Feedback Portal</span>
            <span className="topbar-subtitle">UEM &amp; IEM Kolkata</span>
          </div>
        </div>

        <div className="app-topbar-right">
          <div className="user-pill">
            <span className="user-pill-name">{user.name}</span>
            <span className={`badge ${isAdmin ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>
              {user.role}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile Backdrop Overlay ────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Responsive Sidebar & Slide-over Drawer ─────────────────────── */}
      <aside
        className={`app-sidebar ${drawerOpen ? 'drawer-open' : ''}`}
        aria-label="Main Navigation Sidebar"
      >
        {/* Sidebar Header with Logos */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-wrap">
              <img
                src="/uem-logo-placeholder.png"
                alt="UEM Logo"
                className="sidebar-logo"
              />
              <img
                src="/iem-logo-placeholder.png"
                alt="IEM Logo"
                className="sidebar-logo"
              />
            </div>
            <div className="sidebar-titles">
              <span className="sidebar-inst-name">UEM &amp; IEM</span>
              <span className="sidebar-app-name">Faculty Feedback</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-group-title">MAIN MENU</div>

          {isAdmin ? (
            /* ── Admin Links ───────────────────────────────────────── */
            <>
              <button
                type="button"
                className={`nav-item ${currentPath === '/admin' && currentTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin?tab=overview')}
              >
                <LayoutDashboard size={18} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentPath === '/admin' && currentTab === 'students' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin?tab=students')}
              >
                <Users size={18} />
                <span>Students</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentPath === '/admin' && currentTab === 'faculty' ? 'active' : ''}`}
                onClick={() => handleNavClick('/admin?tab=faculty')}
              >
                <GraduationCap size={18} />
                <span>Faculty</span>
              </button>

              {/* Award of Excellence (with collapsible submenu) */}
              <div className="nav-collapsible-group">
                <button
                  type="button"
                  className={`nav-item nav-item-parent ${currentPath === '/admin' && currentTab === 'awards' ? 'active' : ''}`}
                  onClick={() => {
                    setAwardsMenuOpen(v => !v);
                    if (currentPath !== '/admin' || currentTab !== 'awards') {
                      handleNavClick('/admin?tab=awards&sub=cycles');
                    }
                  }}
                  aria-expanded={awardsMenuOpen}
                >
                  <Award size={18} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Award of Excellence</span>
                  {awardsMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {awardsMenuOpen && (
                  <div className="nav-submenu">
                    <button
                      type="button"
                      className={`nav-subitem ${currentPath === '/admin' && currentTab === 'awards' && currentSub === 'cycles' ? 'active' : ''}`}
                      onClick={() => handleNavClick('/admin?tab=awards&sub=cycles')}
                    >
                      Nomination Cycles
                    </button>
                    <button
                      type="button"
                      className={`nav-subitem ${currentPath === '/admin' && currentTab === 'awards' && currentSub === 'leaderboard' ? 'active' : ''}`}
                      onClick={() => handleNavClick('/admin?tab=awards&sub=leaderboard')}
                    >
                      Leaderboard
                    </button>
                    <button
                      type="button"
                      className={`nav-subitem ${currentPath === '/admin' && currentTab === 'awards' && currentSub === 'history' ? 'active' : ''}`}
                      onClick={() => handleNavClick('/admin?tab=awards&sub=history')}
                    >
                      Previous Cycles / Cycle History
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Student Links ─────────────────────────────────────── */
            <>
              <button
                type="button"
                className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('/dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Overview / Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentPath === '/feedback-list' ? 'active' : ''}`}
                onClick={() => handleNavClick('/feedback-list')}
              >
                <MessageSquareCheck size={18} />
                <span>Submit Feedback</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentPath === '/nominations' ? 'active' : ''}`}
                onClick={() => handleNavClick('/nominations')}
              >
                <Award size={18} />
                <span>Nominate Faculty</span>
              </button>
            </>
          )}

          {/* ── Account Section ───────────────────────────────────── */}
          <div className="nav-group-title" style={{ marginTop: '1.5rem' }}>ACCOUNT</div>

          <button
            type="button"
            className={`nav-item ${currentPath === '/change-password' ? 'active' : ''}`}
            onClick={() => handleNavClick('/change-password')}
          >
            <KeyRound size={18} />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            className="nav-item nav-item-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {isAdmin ? <ShieldCheck size={20} /> : <UserCheck size={20} />}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user.name}>{user.name}</span>
              <span className="sidebar-user-role">
                {user.rollNumber || user.email || (isAdmin ? 'Administrator' : 'Student')}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;