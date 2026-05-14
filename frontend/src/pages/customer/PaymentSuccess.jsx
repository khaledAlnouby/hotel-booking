import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  BedDouble,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtCurrency(val) {
  return '$' + Number(val ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading'); // 'loading' | 'confirmed' | 'error'
  const [reservation, setReservation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No payment session found. Please check your bookings.');
      return;
    }

    api
      .get(`/payments/verify-session/${sessionId}`)
      .then((res) => {
        const booking = res?.data?.data;
        setReservation(booking);
        setStatus('confirmed');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ??
          'We could not verify your payment. Please check your bookings or contact support.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [sessionId]);

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-surface-500 text-sm font-medium">Confirming your booking…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900">Payment Verification Issue</h1>
          <p className="text-sm text-surface-500">{errorMsg}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="primary">View My Bookings</Button>
            </Link>
            <Link to="/hotels">
              <Button variant="secondary">Browse Hotels</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirmed ── */
  const hotel = reservation?.room?.hotel;
  const room = reservation?.room;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">

        {/* Success header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Booking Confirmed!</h1>
          <p className="text-surface-500 text-sm">
            Your reservation has been confirmed. A confirmation will appear in your dashboard.
          </p>
        </div>

        {/* Booking summary card */}
        {reservation && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">

            {/* Hotel thumbnail banner */}
            {hotel?.thumbnail ? (
              <div className="h-36 overflow-hidden">
                <img
                  src={hotel.thumbnail}
                  alt={hotel?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-36 bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-white/30" />
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Hotel & room */}
              <div>
                <h2 className="font-bold text-surface-900">{reservation.hotelName}</h2>
                {hotel?.city && (
                  <div className="flex items-center gap-1 text-surface-400 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {hotel.city}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-100">
                <BedDouble className="w-4 h-4 text-surface-400" />
                <span>
                  {reservation.roomName}
                  {room?.type && (
                    <span className="text-surface-400"> · {room.type.toLowerCase().replace('_', ' ')}</span>
                  )}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                  <p className="text-xs text-primary-500 font-medium mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Check-in
                  </p>
                  <p className="font-semibold text-primary-900">{fmtDate(reservation.checkIn)}</p>
                </div>
                <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                  <p className="text-xs text-primary-500 font-medium mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Check-out
                  </p>
                  <p className="font-semibold text-primary-900">{fmtDate(reservation.checkOut)}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex justify-between items-center border-t border-surface-100 pt-3 text-sm">
                <span className="text-surface-500">
                  {reservation.nights} night{reservation.nights !== 1 ? 's' : ''} · {reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}
                </span>
                <span className="text-lg font-bold text-primary-700">
                  {fmtCurrency(reservation.totalPrice * 1.1)}
                </span>
              </div>

              {/* Booking ID */}
              <div className="text-xs text-surface-400 bg-surface-50 px-3 py-2 rounded-lg font-mono break-all">
                Booking ID: {reservation.id}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dashboard" className="flex-1">
            <Button variant="primary" fullWidth rightIcon={ArrowRight}>
              View My Bookings
            </Button>
          </Link>
          <Link to="/hotels" className="flex-1">
            <Button variant="secondary" fullWidth>
              Browse More Hotels
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
