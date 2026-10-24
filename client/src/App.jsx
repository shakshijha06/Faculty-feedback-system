/**
 * App.jsx — Root component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import FeedbackList   from './pages/FeedbackList';
import FeedbackForm   from './pages/FeedbackForm';
import Nominations    from './pages/Nominations';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';

// Root redirect
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className={`app-shell ${user ? 'app-shell-auth' : 'app-shell-public'}`}>
      {user && <Navbar />}
      <div className={user ? 'app-main-content' : 'app-main-full'}>
        {children}
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Student routes */}
          <Route element={<PrivateRoute role="student" />}>
            <Route path="/dashboard"              element={<Dashboard />} />
            <Route path="/feedback-list"          element={<FeedbackList />} />
            <Route path="/feedback/:facultyId"    element={<FeedbackForm />} />
            <Route path="/nominations"            element={<Nominations />} />
          </Route>

          {/* Admin routes */}
          <Route element={<PrivateRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Shared — both roles */}
          <Route element={<PrivateRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AppLayout>
    </Router>
  </AuthProvider>
);

export default App;
