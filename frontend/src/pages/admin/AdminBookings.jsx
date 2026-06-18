import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  CalendarCheck,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import { Badge, Button, Modal, Spinner } from '../../components/ui';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(v) {
  if (v == null) return '$0';
  return '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/* ─────────────────────────────────────────
   Status badge
───────────────────────────────────────── */
const STATUS_CFG = {
  PENDING:   { variant: 'warning', label: 'Pending'   },
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  CANCELLED: { variant: 'danger',  label: 'Cancelled' },
  COMPLETED: { variant: 'info',    label: 'Completed' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { variant: 'default', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

/* ─────────────────────────────────────────
   Cancel confirm modal
───────────────────────────────────────── */
function CancelModal({ isOpen, onClose, booking, onConfirm, loading }) {
  if (!booking) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking"
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Keep</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={loading}>
            Yes, Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-surface-600">
        Cancel booking <span className="font-mono font-medium">{String(booking.id).slice(0, 8)}</span> for{' '}
        <strong>{booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : '—'}</strong>?
        This cannot be undone.
      </p>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   Main
───────────────────────────────────────── */
export default function AdminBookings() {
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [committedSearch, setCS]      = useState('');
  const [status, setStatus]           = useState('');
  const [page, setPage]               = useState(1);
  const [limit]                       = useState(20);
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminBookings', page, committedSearch, status],
    queryFn: () =>
      api.get('/admin/bookings', { params: { page, limit, status, search: committedSearch } }),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  const bookings    = data?.data?.data ?? [];
  const pagination  = data?.data?.pagination ?? {};
  const totalPages  = pagination.totalPages ?? 1;
  const totalItems  = pagination.total ?? bookings.length;

  const cancelMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/bookings/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      setCancelTarget(null);
    },
  });

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') { setPage(1); setCS(search); }
  }
  function handleSearchBlur() { setPage(1); setCS(search); }

  /* pagination range */
  const delta = 2;
  const pageRange = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pageRange.push(i);
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* header */}
      <div className="bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>Back to Dashboard</Button>
            </Link>
            <div className="h-5 w-px bg-surface-200" />
            <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary-600" />
              All Bookings
            </h1>
          </div>
          <Button variant="secondary" size="sm" leftIcon={RefreshCw} loading={isFetching} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* filters */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest name or hotel…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all placeholder:text-surface-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-surface-600 whitespace-nowrap">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {!isLoading && (
              <span className="text-sm text-surface-400 ml-auto">
                {totalItems.toLocaleString()} booking{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-surface-600 font-medium">Failed to load bookings</p>
              <Button variant="secondary" leftIcon={RefreshCw} size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CalendarCheck className="w-10 h-10 text-surface-300" />
              <p className="text-surface-500 font-medium">No bookings found</p>
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
                    <th className="text-right px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {bookings.map((b) => {
                    const guest    = b.user ? `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() : '—';
                    const hotel    = b.room?.hotel?.name ?? '—';
                    const room     = b.room?.name ?? '—';
                    const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';
                    return (
                      <tr key={b.id} className="hover:bg-surface-50 transition-colors duration-100">
                        <td className="px-6 py-4 font-mono text-xs text-surface-500 whitespace-nowrap">
                          {String(b.id).slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 font-medium text-surface-800 whitespace-nowrap">{guest}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-surface-800">{hotel}</span>
                          <span className="text-surface-400 mx-1">/</span>
                          <span className="text-surface-500">{room}</span>
                        </td>
                        <td className="px-6 py-4 text-surface-600 whitespace-nowrap">{fmtDate(b.checkIn)}</td>
                        <td className="px-6 py-4 text-surface-600 whitespace-nowrap">{fmtDate(b.checkOut)}</td>
                        <td className="px-6 py-4 font-semibold text-surface-900 whitespace-nowrap">
                          {fmtCurrency(b.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={b.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {canCancel && (
                            <button
                              onClick={() => setCancelTarget(b)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-surface-500">
              Page <span className="font-medium text-surface-800">{page}</span> of{' '}
              <span className="font-medium text-surface-800">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageRange.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    'w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-all',
                    p === page
                      ? 'border-primary-400 bg-primary-600 text-white font-semibold'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-100',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CancelModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        booking={cancelTarget}
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
      />
    </div>
  );
}
