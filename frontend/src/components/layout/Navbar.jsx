import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Heart,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  X,
  CheckCheck,
  BedDouble,
  CreditCard,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

/* ─────────────────────────────────────────
   NavLink active class helper
───────────────────────────────────────── */
function navLinkClass({ isActive }) {
  return [
    'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150',
    isActive
      ? 'text-primary-700 bg-primary-50'
      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100',
  ].join(' ');
}

/* ─────────────────────────────────────────
   Notification dropdown
───────────────────────────────────────── */
const NOTIF_ICONS = {
  BOOKING: BedDouble,
  PAYMENT: CreditCard,
  REVIEW:  Star,
  SYSTEM:  Bell,
  MESSAGE: Bell,
};

function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleNotifClick(n) {
    if (!n.isRead) markAsRead(n.id);
    setOpen(false);
    if (n.type === 'BOOKING' || n.type === 'PAYMENT') navigate('/dashboard');
  }

  function fmtTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          'relative hidden sm:flex items-center justify-center',
          'w-9 h-9 rounded-xl',
          'text-surface-500 hover:text-surface-700 hover:bg-surface-100',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        ].join(' ')}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={[
          'absolute right-0 mt-2 w-80',
          'bg-white rounded-2xl shadow-card-hover border border-surface-100',
          'animate-scale-in origin-top-right z-50',
          'flex flex-col overflow-hidden',
        ].join(' ')}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <span className="text-sm font-semibold text-surface-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-surface-400">
                <Bell className="w-8 h-8" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const Icon = NOTIF_ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={[
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                      'hover:bg-surface-50',
                      !n.isRead ? 'bg-primary-50/50' : '',
                    ].join(' ')}
                  >
                    <div className={[
                      'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5',
                      !n.isRead ? 'bg-primary-100' : 'bg-surface-100',
                    ].join(' ')}>
                      <Icon className={`w-4 h-4 ${!n.isRead ? 'text-primary-600' : 'text-surface-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-surface-900' : 'font-medium text-surface-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-surface-400 mt-1">{fmtTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-surface-100">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block text-xs text-center text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                View dashboard →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Dropdown menu
───────────────────────────────────────── */
function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const menuItems = [
    { icon: User, label: 'Profile', to: '/dashboard' },
    { icon: BookOpen, label: 'My Bookings', to: '/dashboard' },
    { icon: Heart, label: 'Favorites', to: '/dashboard' },
  ];

  const handleLogout = async () => {
    setOpen(false);
    await onLogout();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex items-center gap-2 rounded-xl px-2 py-1.5',
          'text-sm font-medium text-surface-700',
          'hover:bg-surface-100 transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        ].join(' ')}
      >
        <Avatar
          src={user?.avatar}
          name={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
          size="sm"
        />
        <span className="hidden sm:block max-w-[120px] truncate">
          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={[
            'absolute right-0 mt-2 w-56 py-1',
            'bg-white rounded-xl shadow-card-hover border border-surface-100',
            'animate-scale-in origin-top-right z-50',
          ].join(' ')}
          role="menu"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-900 truncate">
              {user?.firstName ?? 'Account'}
            </p>
            <p className="text-xs text-surface-500 truncate mt-0.5">
              {user?.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ icon: Icon, label, to }) => (
              <Link
                key={label}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5',
                  'text-sm text-surface-700',
                  'hover:bg-surface-50 hover:text-surface-900',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 text-surface-400 flex-shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-surface-100 pt-1 pb-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={[
                'w-full flex items-center gap-3 px-4 py-2.5',
                'text-sm text-red-600',
                'hover:bg-red-50',
                'transition-colors duration-100',
              ].join(' ')}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Mobile drawer
───────────────────────────────────────── */
function MobileDrawer({ open, onClose, user, onLogout }) {
  const navigate = useNavigate();

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = async () => {
    onClose();
    await onLogout();
    navigate('/');
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-surface-900/50 z-40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-72 max-w-[85vw]',
          'bg-white z-50 shadow-2xl',
          'flex flex-col',
          'animate-slide-down', // repurposed for side-entry feel
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 no-underline"
          >
            <span className="text-2xl" aria-hidden="true">🏨</span>
            <span className="font-display font-bold text-lg text-surface-900">
              LuxStay
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
          <MobileNavLink to="/" onClick={onClose}>Home</MobileNavLink>
          <MobileNavLink to="/hotels" onClick={onClose}>Hotels</MobileNavLink>

          {user?.role === 'OWNER' && (
            <>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  Owner
                </p>
              </div>
              <MobileNavLink to="/owner/hotels" onClick={onClose} icon={Hotel}>
                My Hotels
              </MobileNavLink>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              <MobileNavLink to="/admin" onClick={onClose} icon={Shield}>
                Admin Panel
              </MobileNavLink>
            </>
          )}

          {user && (
            <>
              <div className="border-t border-surface-100 my-2" />
              <MobileNavLink to="/dashboard" onClick={onClose} icon={User}>My Account</MobileNavLink>
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-surface-100 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 truncate">
                  {user?.firstName ?? 'Account'}
                </p>
                <p className="text-xs text-surface-500 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={onClose}>
                <Button variant="secondary" fullWidth>Log in</Button>
              </Link>
              <Link to="/register" onClick={onClose}>
                <Button variant="primary" fullWidth>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MobileNavLink({ to, children, onClick, icon: Icon }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
          'transition-colors duration-150',
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-surface-700 hover:bg-surface-50 hover:text-surface-900',
        ].join(' ')
      }
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
      {children}
    </NavLink>
  );
}

/* ─────────────────────────────────────────
   Main Navbar
───────────────────────────────────────── */
function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <header
      className={[
        'sticky top-0 z-30',
        'bg-white/80 backdrop-blur-md',
        'border-b border-surface-200',
        'shadow-sm',
      ].join(' ')}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2 group no-underline flex-shrink-0"
          >
            <span className="text-2xl" aria-hidden="true">🏨</span>
            <span
              className={[
                'font-display font-bold text-xl',
                'text-surface-900 group-hover:text-primary-700',
                'transition-colors duration-150',
              ].join(' ')}
            >
              LuxStay
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/hotels" className={navLinkClass}>
              Hotels
            </NavLink>
            {user?.role === 'OWNER' && (
              <NavLink to="/owner/hotels" className={navLinkClass}>
                My Hotels
              </NavLink>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Notifications bell */}
                    <NotificationDropdown />

                    {/* User dropdown (desktop) */}
                    <div className="hidden md:block">
                      <UserDropdown user={user} onLogout={handleLogout} />
                    </div>
                  </>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link to="/login">
                      <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="primary" size="sm">Sign up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Hamburger (mobile) */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className={[
                'flex md:hidden items-center justify-center',
                'w-9 h-9 rounded-xl',
                'text-surface-600 hover:text-surface-900 hover:bg-surface-100',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              ].join(' ')}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
}

export default Navbar;
