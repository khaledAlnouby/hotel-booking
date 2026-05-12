import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Lock,
  Star,
  MapPin,
  BedDouble,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Badge, Spinner } from '../../components/ui';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function toDateInputValue(date) {
  // Returns YYYY-MM-DD string for <input type="date">
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return toDateInputValue(new Date());
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function fmtCurrency(val) {
  return '$' + Number(val ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ─────────────────────────────────────────
   Toast — inline lightweight
───────────────────────────────────────── */
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={[
        'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium max-w-sm',
        'animate-fade-in transition-all',
        type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white',
      ].join(' ')}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

/* ─────────────────────────────────────────
   Trust Badges Row
───────────────────────────────────────── */
function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-100">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-green-600" />
        </div>
        <span className="text-xs text-surface-500 font-medium leading-tight">Secure Booking</span>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary-600" />
        </div>
        <span className="text-xs text-surface-500 font-medium leading-tight">SSL Encrypted</span>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-xs text-surface-500 font-medium leading-tight">Safe Payment</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Order Summary Card
───────────────────────────────────────── */
function OrderSummary({ hotel, room, checkIn, checkOut }) {
  const nights  = nightsBetween(checkIn, checkOut);
  const price   = room?.pricePerNight ?? 0;
  const subtotal = nights * price;
  const tax     = subtotal * 0.1;
  const total   = subtotal + tax;

  return (
    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden sticky top-6">
      {/* Hotel thumbnail */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-700 to-primary-500">
        {hotel?.thumbnail ? (
          <img
            src={hotel.thumbnail}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/30" />
          </div>
        )}
        {hotel?.stars > 0 && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" size="sm">
              {'★'.repeat(Math.min(hotel.stars, 5))}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Hotel info */}
        <div>
          <h2 className="text-base font-bold text-surface-900 leading-snug">
            {hotel?.name ?? 'Hotel'}
          </h2>
          {hotel?.city && (
            <div className="flex items-center gap-1 text-surface-500 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {hotel.city}
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="flex items-center gap-2 p-3 bg-surface-50 rounded-xl border border-surface-100">
          <BedDouble className="w-4 h-4 text-surface-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-surface-800">
              {room?.name ?? 'Room'}
            </p>
            {room?.type && (
              <p className="text-xs text-surface-400 capitalize">
                {room.type.toLowerCase().replace('_', ' ')}
              </p>
            )}
          </div>
        </div>

        {/* Dates summary */}
        {checkIn && checkOut && (
          <div className="flex items-center justify-between text-sm text-surface-600 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <div className="text-center">
              <p className="text-xs text-primary-500 font-medium mb-0.5">Check-in</p>
              <p className="font-semibold text-primary-800">{fmtDate(checkIn)}</p>
            </div>
            <div className="text-primary-300 text-lg">→</div>
            <div className="text-center">
              <p className="text-xs text-primary-500 font-medium mb-0.5">Check-out</p>
              <p className="font-semibold text-primary-800">{fmtDate(checkOut)}</p>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center text-surface-600">
            <span>Price per night</span>
            <span className="font-medium">{fmtCurrency(price)}</span>
          </div>
          <div className="flex justify-between items-center text-surface-600">
            <span>
              {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Nights'}
            </span>
            <span className="font-medium">{fmtCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-surface-500">
            <span>Taxes &amp; fees (10%)</span>
            <span>{fmtCurrency(tax)}</span>
          </div>

          <div className="border-t border-surface-100 pt-3 flex justify-between items-center">
            <span className="text-base font-bold text-surface-900">Total</span>
            <span className="text-xl font-bold text-primary-700">{fmtCurrency(total)}</span>
          </div>
        </div>

        {/* Trust badges */}
        <TrustBadges />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function Checkout() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  /* ── checkout data from localStorage ── */
  const [hotel, setHotel] = useState(null);
  const [room,  setRoom]  = useState(null);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('checkoutData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hotel) setHotel(parsed.hotel);
        if (parsed.room)  setRoom(parsed.room);
      }
    } catch {
      // ignore parse errors
    }
    setDataReady(true);
  }, []);

  /* ── fallback fetch when localStorage has no room data ── */
  const needsFetch = dataReady && !room && roomId;

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    api
      .get(`/rooms/${roomId}`)
      .then((res) => {
        if (cancelled) return;
        const r = res?.data?.data ?? null;
        if (r) {
          setRoom(r);
          if (r.hotel) setHotel(r.hotel);
        }
      })
      .catch(() => {
        // endpoint may not exist — leave room as null, form still usable
      });
    return () => { cancelled = true; };
  }, [needsFetch, roomId]);

  /* ── form state ── */
  const [checkIn,          setCheckIn]          = useState('');
  const [checkOut,         setCheckOut]         = useState('');
  const [guests,           setGuests]           = useState(1);
  const [specialRequests,  setSpecialRequests]  = useState('');
  const [formError,        setFormError]        = useState('');
  const [toast,            setToast]            = useState(null);

  const today = todayStr();

  /* ── derived ── */
  const nights  = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const capacity = room?.capacity ?? 10;

  /* ── validation ── */
  function validate() {
    if (!checkIn)  return 'Please select a check-in date.';
    if (!checkOut) return 'Please select a check-out date.';
    if (checkIn < today) return 'Check-in date cannot be in the past.';
    if (checkOut <= checkIn) return 'Check-out must be after check-in.';
    if (guests < 1 || guests > capacity)
      return `Number of guests must be between 1 and ${capacity}.`;
    return null;
  }

  /* ── mutation ── */
  const bookMutation = useMutation({
    mutationFn: (payload) => api.post('/payments/create-checkout-session', payload),
    onSuccess: (res) => {
      const url = res?.data?.data?.url;
      if (url) {
        // Redirect to Stripe Checkout (hosted page)
        window.location.href = url;
      } else {
        setToast({ message: 'Could not start payment. Please try again.', type: 'error' });
      }
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ??
        'Booking failed. Please try again.';
      setToast({ message: msg, type: 'error' });
    },
  });

  /* ── submit ── */
  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    bookMutation.mutate({
      roomId,
      checkIn,
      checkOut,
      guests: Number(guests),
      specialRequests: specialRequests.trim() || undefined,
    });
  }

  /* ── handle checkout-date minimum ── */
  const minCheckOut = checkIn
    ? toDateInputValue(new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000))
    : today;

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : '';

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-xl font-bold text-surface-900">Complete Your Booking</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Review your details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* ── Left: Booking Form ── */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Guest Info (read-only display) */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                Guest Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl">
                    {fullName || <span className="text-surface-400 italic">Not available</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl">
                    {user?.email || <span className="text-surface-400 italic">Not available</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                Stay Dates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Check-in */}
                <div>
                  <label
                    htmlFor="checkIn"
                    className="block text-sm font-medium text-surface-700 mb-1.5"
                  >
                    Check-in Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkIn"
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      // If check-out is now invalid, clear it
                      if (checkOut && checkOut <= e.target.value) {
                        setCheckOut('');
                      }
                    }}
                    required
                    className="w-full px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Check-out */}
                <div>
                  <label
                    htmlFor="checkOut"
                    className="block text-sm font-medium text-surface-700 mb-1.5"
                  >
                    Check-out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkOut"
                    type="date"
                    min={minCheckOut}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {nights > 0 && (
                <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <strong>{nights}</strong> night{nights !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>

            {/* Guests + Special Requests */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                Additional Details
              </h2>

              {/* Guests */}
              <div>
                <label
                  htmlFor="guests"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-lg"
                    aria-label="Decrease guests"
                  >
                    −
                  </button>
                  <input
                    id="guests"
                    type="number"
                    min={1}
                    max={capacity}
                    value={guests}
                    onChange={(e) =>
                      setGuests(Math.min(capacity, Math.max(1, Number(e.target.value))))
                    }
                    className="w-20 text-center px-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.min(capacity, g + 1))}
                    disabled={guests >= capacity}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-lg"
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                  <span className="text-sm text-surface-400">
                    (max {capacity})
                  </span>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label
                  htmlFor="specialRequests"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Special Requests{' '}
                  <span className="text-surface-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="specialRequests"
                  rows={4}
                  placeholder="e.g. Early check-in, high floor preference, dietary requirements…"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-3 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all resize-none placeholder:text-surface-400"
                />
                <p className="text-xs text-surface-400 mt-1">
                  Requests are not guaranteed but we'll do our best to accommodate them.
                </p>
              </div>
            </div>

            {/* Error message */}
            {formError && (
              <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={bookMutation.isPending}
              disabled={bookMutation.isPending}
              leftIcon={ShieldCheck}
            >
              {bookMutation.isPending ? 'Redirecting to payment…' : 'Proceed to Payment'}
            </Button>

            <p className="text-center text-xs text-surface-400">
              By completing this booking you agree to our{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Cancellation Policy
              </a>
              .
            </p>
          </form>

          {/* ── Right: Order Summary ── */}
          <aside>
            <OrderSummary
              hotel={hotel}
              room={room}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
