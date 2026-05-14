import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, Search } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const reservationId  = searchParams.get('reservation_id');
  const cancelledRef   = useRef(false);

  // Fire-and-forget: release the PENDING reservation so the room becomes bookable again
  useEffect(() => {
    if (!reservationId || cancelledRef.current) return;
    cancelledRef.current = true;

    api
      .post(`/payments/cancel-reservation/${reservationId}`)
      .catch(() => {
        // Silently ignore — the reservation will remain PENDING until an admin cleans it up
      });
  }, [reservationId]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-surface-900">Payment Cancelled</h1>
          <p className="text-surface-500 text-sm leading-relaxed">
            Your payment was not completed and your reservation has been released.
            No charges were made to your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/hotels">
            <Button variant="primary" leftIcon={Search}>
              Browse Hotels
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" leftIcon={ArrowLeft}>
              My Bookings
            </Button>
          </Link>
        </div>

        <p className="text-xs text-surface-400">
          Changed your mind?{' '}
          <Link to="/hotels" className="text-primary-600 hover:underline">
            Search for a room
          </Link>{' '}
          and start the booking again.
        </p>
      </div>
    </div>
  );
}
