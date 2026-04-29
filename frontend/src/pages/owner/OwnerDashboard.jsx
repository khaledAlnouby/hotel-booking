import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  BedDouble,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
  CircleDollarSign,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Badge, Spinner } from '../../components/ui';

/* ─────────────────────────────────────────
   API helpers
───────────────────────────────────────── */
async function fetchMyHotels() {
  const { data } = await api.get('/hotels/owner/my-hotels');
  return data?.data ?? [];
}

async function fetchAllBookings() {
  const { data } = await api.get('/bookings');
  return data?.data ?? [];
}

/* ─────────────────────────────────────────
   Stat card
───────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, colorClass, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface-500 truncate">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-16 bg-surface-200 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-surface-900 tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Booking status badge variant
───────────────────────────────────────── */
function bookingVariant(status) {
  const map = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    CANCELLED: 'danger',
    COMPLETED: 'info',
  };
  return map[status?.toUpperCase()] ?? 'default';
}

/* ─────────────────────────────────────────
   Format helpers
───────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Hotels ── */
  const {
    data: hotels = [],
    isLoading: hotelsLoading,
    isError: hotelsError,
  } = useQuery({
    queryKey: ['myHotels'],
    queryFn: fetchMyHotels,
  });

  /* ── All owner bookings (single query) ── */
  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['ownerBookings'],
    queryFn: fetchAllBookings,
  });

  /* ── Aggregated stats ── */
  const stats = useMemo(() => {
    const totalHotels = hotels.length;
    const activeHotels = hotels.filter((h) => h.isActive !== false).length;

    const totalRooms = hotels.reduce((sum, h) => {
      if (Array.isArray(h.rooms)) return sum + h.rooms.length;
      return sum + (h._count?.rooms ?? 0);
    }, 0);

    const recentBookings = [...allBookings]
      .sort((a, b) => new Date(b.createdAt ?? b.checkIn) - new Date(a.createdAt ?? a.checkIn))
      .slice(0, 10);

    const totalRevenue = allBookings
      .filter((b) => {
        const s = (b.status ?? '').toUpperCase();
        return s === 'CONFIRMED' || s === 'COMPLETED';
      })
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    return { totalHotels, activeHotels, totalRooms, recentBookings, totalRevenue, totalBookings: allBookings.length };
  }, [hotels, allBookings]);

  const firstHotelId = hotels[0]?._id ?? hotels[0]?.id;

  /* ── Greeting ── */
  const firstName = user?.firstName ?? 'Owner';

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-surface-900 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Here's an overview of your hotel portfolio.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate('/owner/hotels')}
              leftIcon={Building2}
            >
              Manage Hotels
            </Button>
            {firstHotelId && (
              <Button
                variant="primary"
                onClick={() => navigate(`/owner/hotels/${firstHotelId}/rooms`)}
                leftIcon={BedDouble}
              >
                Manage Rooms
              </Button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Hotels"
            value={stats.totalHotels}
            icon={Building2}
            colorClass="bg-primary-50 text-primary-600"
            loading={hotelsLoading}
          />
          <StatCard
            label="Active Hotels"
            value={stats.activeHotels}
            icon={TrendingUp}
            colorClass="bg-green-50 text-green-600"
            loading={hotelsLoading}
          />
          <StatCard
            label="Total Rooms"
            value={stats.totalRooms}
            icon={BedDouble}
            colorClass="bg-accent-50 text-accent-600"
            loading={hotelsLoading}
          />
          <StatCard
            label="Total Bookings"
            value={stats.totalBookings}
            icon={CalendarCheck}
            colorClass="bg-blue-50 text-blue-600"
            loading={bookingsLoading}
          />
        </div>

        {/* Revenue highlight */}
        {!bookingsLoading && stats.totalRevenue > 0 && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 flex items-center justify-between text-white shadow-md">
            <div>
              <p className="text-primary-200 text-sm font-medium">Total Revenue (Confirmed + Completed)</p>
              <p className="text-4xl font-bold mt-1 tabular-nums">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <CircleDollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {/* Error state */}
        {hotelsError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="font-semibold text-red-700">Failed to load hotel data</p>
            <p className="text-sm text-red-500 mt-1">Please refresh the page and try again.</p>
          </div>
        )}

        {/* Hotel list quick view */}
        {!hotelsLoading && hotels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-800">Your Hotels</h2>
              <Link
                to="/owner/hotels"
                className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline transition-colors duration-150 flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.slice(0, 3).map((hotel) => {
                const hid = hotel._id ?? hotel.id;
                const isActive = hotel.isActive ?? hotel.status === 'active' ?? true;
                const roomCount = Array.isArray(hotel.rooms)
                  ? hotel.rooms.length
                  : (hotel.roomCount ?? hotel.rooms ?? 0);

                return (
                  <div
                    key={hid}
                    className="bg-white rounded-xl border border-surface-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 text-sm truncate">{hotel.name}</p>
                      <p className="text-xs text-surface-400 mt-0.5 truncate">
                        {hotel.city}, {hotel.country} · {roomCount} room{roomCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={isActive ? 'success' : 'default'} size="sm" dot>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <button
                        onClick={() => navigate(`/owner/hotels/${hid}/rooms`)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors duration-150"
                      >
                        Rooms →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No hotels onboarding */}
        {!hotelsLoading && hotels.length === 0 && !hotelsError && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-surface-700">No hotels yet</p>
              <p className="text-sm text-surface-500 mt-1">
                Get started by adding your first hotel.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/owner/hotels')}>
              Add Your First Hotel
            </Button>
          </div>
        )}

        {/* Recent bookings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800">Recent Bookings</h2>
            {stats.recentBookings.length > 0 && (
              <span className="text-xs text-surface-400 font-medium">Top 10</span>
            )}
          </div>

          {bookingsLoading && (
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 flex items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-surface-400 font-medium">Loading bookings…</p>
            </div>
          )}

          {!bookingsLoading && stats.recentBookings.length === 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-surface-300" />
              </div>
              <p className="text-sm font-medium text-surface-500">No bookings yet</p>
            </div>
          )}

          {!bookingsLoading && stats.recentBookings.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Hotel / Room
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {stats.recentBookings.map((booking) => {
                      const bid = booking._id ?? booking.id;
                      const guestName =
                        booking.user?.firstName
                          ? `${booking.user.firstName} ${booking.user.lastName ?? ''}`.trim()
                          : (booking.guestName ?? booking.guest?.name ?? 'Guest');
                      const hotelName =
                        booking.hotel?.name ??
                        hotels.find((h) => (h._id ?? h.id) === (booking.hotelId ?? booking.hotel))?.name ??
                        '';
                      const roomName = booking.room?.name ?? booking.roomName ?? '';

                      return (
                        <tr
                          key={bid}
                          className="hover:bg-surface-50/60 transition-colors duration-100"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-surface-400" />
                              </div>
                              <span className="font-medium text-surface-800 truncate max-w-[120px]">
                                {guestName}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-surface-700 truncate max-w-[140px]">
                              {hotelName || '—'}
                            </p>
                            {roomName && (
                              <p className="text-xs text-surface-400 mt-0.5 truncate">
                                {roomName}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-surface-600 whitespace-nowrap">
                            {formatDate(booking.checkIn)}
                          </td>
                          <td className="px-5 py-4 text-surface-600 whitespace-nowrap">
                            {formatDate(booking.checkOut)}
                          </td>
                          <td className="px-5 py-4 font-semibold text-surface-800 whitespace-nowrap">
                            {formatCurrency(booking.totalPrice)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={bookingVariant(booking.status)}>
                              {booking.status
                                ? booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1).toLowerCase()
                                : '—'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
