import React, { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Navbar, Footer, ProtectedRoute, RoleRoute } from './components/layout';
import { Spinner } from './components/ui';

/* ─────────────────────────────────────────
   Full-page Suspense fallback
───────────────────────────────────────── */
function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-surface-400">Loading…</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Lazy page imports
───────────────────────────────────────── */
// Public pages
const Home          = lazy(() => import('./pages/customer/Home'));
const HotelSearch   = lazy(() => import('./pages/customer/HotelSearch'));
const HotelDetail   = lazy(() => import('./pages/customer/HotelDetail'));
const Login         = lazy(() => import('./pages/auth/Login'));
const Register      = lazy(() => import('./pages/auth/Register'));

// Protected – any authenticated user
const Checkout        = lazy(() => import('./pages/customer/Checkout'));
const PaymentSuccess  = lazy(() => import('./pages/customer/PaymentSuccess'));
const PaymentCancel   = lazy(() => import('./pages/customer/PaymentCancel'));

// Protected – CUSTOMER only
const MyDashboard   = lazy(() => import('./pages/customer/MyDashboard'));

// Protected – OWNER only
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const ManageHotels  = lazy(() => import('./pages/owner/ManageHotels'));
const ManageRooms   = lazy(() => import('./pages/owner/ManageRooms'));

// Protected – ADMIN only
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));

// Catch-all
const NotFound      = lazy(() => import('./pages/NotFound'));

/* ─────────────────────────────────────────
   Layout routes
───────────────────────────────────────── */

/**
 * MainLayout — Navbar + Footer wrapping every route.
 * Auth pages (login / register) still render Navbar but no Footer,
 * controlled via the auth-specific layout below.
 */
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * AuthLayout — Navbar only, no Footer (cleaner auth UX).
 */
function AuthLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   App
───────────────────────────────────────── */
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Auth layout: Navbar, no Footer ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ── Main layout: Navbar + Footer ── */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/"           element={<Home />} />
          <Route path="/hotels"     element={<HotelSearch />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />

          {/* Protected – any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:roomId"  element={<Checkout />} />
            <Route path="/payment/success"   element={<PaymentSuccess />} />
            <Route path="/payment/cancel"    element={<PaymentCancel />} />
          </Route>

          {/* Protected – CUSTOMER only */}
          <Route element={<RoleRoute roles={['CUSTOMER']} />}>
            <Route path="/dashboard" element={<MyDashboard />} />
          </Route>

          {/* Protected – OWNER only */}
          <Route element={<RoleRoute roles={['OWNER']} />}>
            <Route path="/owner"                          element={<OwnerDashboard />} />
            <Route path="/owner/hotels"                   element={<ManageHotels />} />
            <Route path="/owner/hotels/:hotelId/rooms"    element={<ManageRooms />} />
          </Route>

          {/* Protected – ADMIN only */}
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/admin"       element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
