import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

/**
 * ProtectedRoute
 *
 * Renders its children (or <Outlet /> for nested routes) only when the user
 * is authenticated.  While the auth state is still being resolved from the
 * stored refresh token it shows a full-page loading spinner.  If the user is
 * not authenticated they are redirected to /login, with the current location
 * stored in router state so the login page can redirect back after success.
 *
 * Usage (children pattern):
 *   <ProtectedRoute><ProfilePage /></ProtectedRoute>
 *
 * Usage (Outlet pattern for nested routes in the router config):
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/profile" element={<ProfilePage />} />
 *   </Route>
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-surface-50"
        aria-label="Loading, please wait"
        role="status"
      >
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-surface-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Support both patterns: explicit children OR nested <Outlet />
  return children ?? <Outlet />;
}

export default ProtectedRoute;
