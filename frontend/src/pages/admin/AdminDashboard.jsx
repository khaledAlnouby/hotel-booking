import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../lib/axios';
import { Badge, Button, Spinner } from '../../components/ui';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtCurrency(value) {
  if (value == null) return '$0';
  return '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ─────────────────────────────────────────
   Status badge
───────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING:   { variant: 'warning',  label: 'Pending'   },
  CONFIRMED: { variant: 'success',  label: 'Confirmed' },
  CANCELLED: { variant: 'danger',   label: 'Cancelled' },
  COMPLETED: { variant: 'info',     label: 'Completed' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { variant: 'default', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

/* ─────────────────────────────────────────
   Stat card
───────────────────────────────────────── */
function StatCard({ label, value, Icon, colorClass, bgClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <Icon className={`w-7 h-7 ${colorClass}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-surface-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-surface-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CSS bar chart
───────────────────────────────────────── */
const BAR_COLORS = {
  PENDING:   { bg: 'bg-yellow-400', text: 'text-yellow-700' },
  CONFIRMED: { bg: 'bg-green-400',  text: 'text-green-700'  },
  CANCELLED: { bg: 'bg-red-400',    text: 'text-red-700'    },
  COMPLETED: { bg: 'bg-blue-400',   text: 'text-blue-700'   },
  CUSTOMER:  { bg: 'bg-primary-400', text: 'text-primary-700' },
  OWNER:     { bg: 'bg-accent-400',  text: 'text-accent-700'  },
  ADMIN:     { bg: 'bg-purple-400',  text: 'text-purple-700'  },
};

function HorizontalBar({ label, count, total, colorBg, colorText }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${colorText}`}>{label}</span>
        <span className="text-surface-500">
          {count.toLocaleString()} <span className="text-surface-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorBg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AdminDashboard() {
  const [bookingsView, setBookingsView] = useState('table');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/dashboard'),
    staleTime: 60 * 1000,
  });

  const stats = data?.data?.data ?? null;

  /* ── loading skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-9 bg-surface-200 rounded-xl animate-pulse w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-24 animate-pulse" />
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  /* ── error state ── */
  if (isError || !stats) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-surface-700 font-medium">Failed to load dashboard data.</p>
          <Button variant="secondary" leftIcon={RefreshCw} onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  /* ── data ── */
  const {
    totalUsers = 0,
    totalHotels = 0,
    totalBookings = 0,
    totalRevenue = 0,
    usersByRole = {},
    bookingsByStatus = {},
    recentBookings = [],
  } = stats;

  const bookingTotal = Object.values(bookingsByStatus).reduce((a, b) => a + b, 0);
  const userTotal    = Object.values(usersByRole).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
            <p className="text-sm text-surface-500 mt-0.5">{todayLabel()}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            loading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            label="Total Users"
            value={totalUsers.toLocaleString()}
            Icon={Users}
            colorClass="text-primary-600"
            bgClass="bg-primary-50"
          />
          <StatCard
            label="Total Hotels"
            value={totalHotels.toLocaleString()}
            Icon={Building2}
            colorClass="text-accent-600"
            bgClass="bg-accent-50"
          />
          <StatCard
            label="Total Bookings"
            value={totalBookings.toLocaleString()}
            Icon={CalendarCheck}
            colorClass="text-green-600"
            bgClass="bg-green-50"
          />
          <StatCard
            label="Total Revenue"
            value={fmtCurrency(totalRevenue)}
            Icon={TrendingUp}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings by Status */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-surface-900 mb-5">
              Bookings by Status
            </h2>
            <div className="space-y-4">
              {Object.entries(bookingsByStatus).map(([status, count]) => (
                <HorizontalBar
                  key={status}
                  label={status.charAt(0) + status.slice(1).toLowerCase()}
                  count={count}
                  total={bookingTotal}
                  colorBg={BAR_COLORS[status]?.bg ?? 'bg-surface-400'}
                  colorText={BAR_COLORS[status]?.text ?? 'text-surface-600'}
                />
              ))}
              {bookingTotal === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">No bookings data</p>
              )}
            </div>
          </div>

          {/* Users by Role */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-surface-900 mb-5">
              Users by Role
            </h2>
            <div className="space-y-4">
              {Object.entries(usersByRole).map(([role, count]) => (
                <HorizontalBar
                  key={role}
                  label={role.charAt(0) + role.slice(1).toLowerCase()}
                  count={count}
                  total={userTotal}
                  colorBg={BAR_COLORS[role]?.bg ?? 'bg-surface-400'}
                  colorText={BAR_COLORS[role]?.text ?? 'text-surface-600'}
                />
              ))}
              {userTotal === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">No user data</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Bookings table ── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Recent Bookings</h2>
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-14">
              <CalendarCheck className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No recent bookings to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">#ID</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Guest</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Hotel / Room</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Check-in</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Check-out</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {recentBookings.map((booking) => {
                    const guestName = booking.user
                      ? `${booking.user.firstName ?? ''} ${booking.user.lastName ?? ''}`.trim()
                      : '—';
                    const hotelName = booking.room?.hotel?.name ?? '—';
                    const roomName  = booking.room?.name ?? '—';

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-surface-50 transition-colors duration-100"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-surface-500 whitespace-nowrap">
                          {String(booking.id).slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 font-medium text-surface-800 whitespace-nowrap">
                          {guestName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-surface-800">{hotelName}</span>
                          <span className="text-surface-400 mx-1">/</span>
                          <span className="text-surface-500">{roomName}</span>
                        </td>
                        <td className="px-6 py-4 text-surface-600 whitespace-nowrap">
                          {fmtDate(booking.checkIn)}
                        </td>
                        <td className="px-6 py-4 text-surface-600 whitespace-nowrap">
                          {fmtDate(booking.checkOut)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-surface-900 whitespace-nowrap">
                          {fmtCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-surface-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users">
              <Button leftIcon={Users}>Manage Users</Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={CalendarCheck}
              onClick={() => setBookingsView(v => v === 'table' ? 'detail' : 'table')}
            >
              View All Bookings
            </Button>
            <Link to="/admin/hotels">
              <Button variant="outline" leftIcon={Building2}>
                Manage Hotels
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
