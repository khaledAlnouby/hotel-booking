import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

/**
 * RoleRoute
 *
 * Extends ProtectedRoute with role-based access control.
 *
 * Props:
 *   roles  — array of allowed role strings (e.g. ['OWNER', 'ADMIN'])
 *   children — optional; falls back to <Outlet /> for nested route configs
 *
 * Redirect logic when the user's role is NOT in the allowed list:
 *   ADMIN   → /admin
 *   OWNER   → /owner/hotels
 *   default → / (customer home)
 *
 * Usage (children pattern):
 *   <RoleRoute roles={['ADMIN']}><AdminPage /></RoleRoute>
 *
 * Usage (Outlet / nested routes):
 *   <Route element={<RoleRoute roles={['OWNER']} />}>
 *     <Route path="/owner/hotels" element={<MyHotels />} />
 *   </Route>
 */

/* ─── Role → home path mapping ─────────── */
const ROLE_HOME = {
  ADMIN: '/admin',
  OWNER: '/owner/hotels',
  CUSTOMER: '/',
};

function getFallbackPath(role) {
  return ROLE_HOME[role] ?? '/';
}

/* ─── Component ─────────────────────────── */
function RoleRoute({ roles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /* 1. Still resolving session */
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

  /* 2. Not logged in at all → go to login */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /* 3. Logged in but wrong role → redirect to their own home */
  if (roles.length > 0 && !roles.includes(user?.role)) {
    const fallback = getFallbackPath(user?.role);
    return <Navigate to={fallback} replace />;
  }

  /* 4. Authorised */
  return children ?? <Outlet />;
}

export default RoleRoute;
