import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Heart,
  User,
  BedDouble,
  XCircle,
  AlertTriangle,
  Star,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  Badge,
  Modal,
  Avatar,
  StarRating,
  Spinner,
} from '../../components/ui';

/* ─────────────────────────────────────────
   Status badge helper
───────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING: { variant: 'warning', label: 'Pending' },
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  COMPLETED: { variant: 'info', label: 'Completed' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { variant: 'default', label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

/* ─────────────────────────────────────────
   Format date helper
───────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function nightsBetween(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/* ─────────────────────────────────────────
   Cancel Booking Confirmation Modal
───────────────────────────────────────── */
function CancelModal({ isOpen, onClose, booking, onConfirm, loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking"
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            Yes, Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Are you sure you want to cancel?
            </p>
            {booking && (
              <p className="text-xs text-yellow-700 mt-1">
                Booking at{' '}
                <strong>{booking.room?.hotel?.name}</strong> from{' '}
                {fmtDate(booking.checkIn)} to {fmtDate(booking.checkOut)} will
                be cancelled.
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-surface-500">
          This action cannot be undone. Please review cancellation policies
          before proceeding.
        </p>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   My Bookings Tab
───────────────────────────────────────── */
function MyBookingsTab() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings'),
    staleTime: 30 * 1000,
  });

  const bookings = data?.data?.data ?? [];

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setCancelTarget(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-5 flex gap-4">
            <div className="w-24 h-20 bg-surface-200 rounded-xl animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-surface-200 rounded animate-shimmer w-2/3" />
              <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/2" />
              <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-surface-600 font-medium">Failed to load bookings</p>
        <p className="text-surface-400 text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BedDouble className="w-10 h-10 text-surface-300" />
        </div>
        <h3 className="text-lg font-semibold text-surface-800 mb-2">
          No bookings yet
        </h3>
        <p className="text-surface-400 text-sm mb-6 max-w-xs mx-auto">
          You haven't made any bookings. Start exploring hotels to find your
          perfect stay.
        </p>
        <Button as={Link} to="/hotels">
          Browse Hotels
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const nights = nightsBetween(booking.checkIn, booking.checkOut);
          const canCancel =
            booking.status === 'PENDING' || booking.status === 'CONFIRMED';

          return (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Hotel thumbnail */}
                <div className="sm:w-36 h-40 sm:h-auto flex-shrink-0">
                  {booking.room?.hotel?.thumbnail ? (
                    <img
                      src={booking.room.hotel.thumbnail}
                      alt={booking.room.hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-white/40" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-surface-900 text-base">
                        {booking.room?.hotel?.name ?? 'Hotel'}
                      </h3>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {booking.room?.name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-surface-600">
                      <Calendar className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>
                        {fmtDate(booking.checkIn)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-600">
                      <Calendar className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>
                        {fmtDate(booking.checkOut)}
                      </span>
                    </div>
                    {nights > 0 && (
                      <div className="text-sm text-surface-500">
                        {nights} night{nights !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                    <div>
                      <span className="text-xs text-surface-400">Total paid</span>
                      <p className="text-lg font-bold text-primary-700">
                        ${booking.totalPrice?.toFixed(2) ?? '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={XCircle}
                          onClick={() => setCancelTarget(booking)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        as={Link}
                        to={`/hotels/${booking.room?.hotel?.id ?? '#'}`}
                        rightIcon={ChevronRight}
                      >
                        View Hotel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CancelModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        booking={cancelTarget}
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id);
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────
   Favorites Tab
───────────────────────────────────────── */
function FavoritesTab() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites'),
    staleTime: 30 * 1000,
  });

  const favorites = data?.data?.data ?? [];

  const removeMutation = useMutation({
    mutationFn: (hotelId) => api.post(`/favorites/${hotelId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="h-40 bg-surface-200 animate-shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-surface-200 rounded animate-shimmer w-3/4" />
              <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-surface-600 font-medium">Failed to load favorites</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Heart className="w-10 h-10 text-surface-300" />
        </div>
        <h3 className="text-lg font-semibold text-surface-800 mb-2">
          No favorites yet
        </h3>
        <p className="text-surface-400 text-sm mb-6 max-w-xs mx-auto">
          Save hotels you love by clicking the heart icon on any hotel listing.
        </p>
        <Link to="/hotels">
          <Button>Browse Hotels</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {favorites.map(({ hotelId, hotel }) => (
        <div
          key={hotelId}
          className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group animate-fade-in"
        >
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            {hotel?.thumbnail ? (
              <img
                src={hotel.thumbnail}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-white/40" />
              </div>
            )}
            {/* Remove button overlay */}
            <button
              onClick={() => removeMutation.mutate(hotelId)}
              disabled={removeMutation.isPending}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-red-500 flex items-center justify-center hover:bg-white shadow-sm transition-all"
              aria-label="Remove from favorites"
            >
              {removeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 fill-current" />
              )}
            </button>

            {hotel?.stars > 0 && (
              <div className="absolute top-3 left-3">
                <Badge variant="warning" size="sm">
                  {'★'.repeat(hotel.stars)}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-surface-900 text-base line-clamp-1">
              {hotel?.name ?? 'Hotel'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-surface-500 text-sm">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{hotel?.city}</span>
            </div>
            {hotel?.avgRating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={hotel.avgRating} size="sm" readOnly />
                <span className="text-xs text-surface-400">
                  {hotel.avgRating.toFixed(1)}
                </span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-surface-100">
              <Link to={`/hotels/${hotelId}`}>
                <Button size="sm" fullWidth variant="outline">
                  View Hotel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Profile Tab
───────────────────────────────────────── */
function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/profile', payload),
    onSuccess: (res) => {
      const updated = res?.data?.data ?? form;
      updateUser(updated);
      setEditing(false);
      setError('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message ?? 'Failed to update profile. Please try again.',
      );
    },
  });

  function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    updateMutation.mutate(form);
  }

  function handleCancel() {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    });
    setEditing(false);
    setError('');
  }

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar + Name */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-5 mb-6">
          <Avatar name={fullName} src={user?.avatar} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-surface-900">{fullName}</h2>
            <p className="text-surface-500 text-sm mt-0.5">{user?.email}</p>
            {user?.role && (
              <Badge variant="primary" size="sm" className="mt-2">
                {user.role}
              </Badge>
            )}
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <Save className="w-4 h-4 flex-shrink-0" />
            Profile updated successfully!
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white placeholder:text-surface-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                leftIcon={Save}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                leftIcon={X}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                <User className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Full Name</p>
                  <p className="text-sm font-medium text-surface-800">{fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                <Mail className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Email Address</p>
                  <p className="text-sm font-medium text-surface-800">
                    {user?.email ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                <Phone className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Phone Number</p>
                  <p className="text-sm font-medium text-surface-800">
                    {user?.phone ?? (
                      <span className="text-surface-400 italic">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-100 mt-4">
              <Button
                variant="outline"
                leftIcon={Edit2}
                onClick={() => {
                  setForm({
                    firstName: user?.firstName ?? '',
                    lastName: user?.lastName ?? '',
                    phone: user?.phone ?? '',
                  });
                  setEditing(true);
                  setSuccess(false);
                }}
              >
                Edit Profile
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4">
          Account Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-surface-500">Member since</span>
            <span className="font-medium text-surface-800">
              {user?.createdAt ? fmtDate(user.createdAt) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-surface-500">Account type</span>
            <Badge variant="primary" size="sm">
              {user?.role ?? 'CUSTOMER'}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-surface-500">Account status</span>
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tabs config
───────────────────────────────────────── */
const TABS = [
  { id: 'bookings', label: 'My Bookings', icon: BedDouble },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function MyDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User'}
              src={user?.avatar}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold text-surface-900">
                Welcome back,{' '}
                <span className="text-primary-700">
                  {user?.firstName ?? 'Traveler'}
                </span>
                !
              </h1>
              <p className="text-surface-500 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150',
                  activeTab === id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'bookings' && <MyBookingsTab />}
        {activeTab === 'favorites' && <FavoritesTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}
