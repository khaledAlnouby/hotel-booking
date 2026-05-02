import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ArrowLeft,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../lib/axios';
import { Avatar, Badge, Button, Modal, Spinner } from '../../components/ui';

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

/* ─────────────────────────────────────────
   Role badge
───────────────────────────────────────── */
const ROLE_VARIANT = {
  ADMIN:    'danger',
  OWNER:    'warning',
  CUSTOMER: 'primary',
};

function RoleBadge({ role }) {
  return (
    <Badge variant={ROLE_VARIANT[role] ?? 'default'}>
      {role}
    </Badge>
  );
}

/* ─────────────────────────────────────────
   Toggle Status Confirm Modal
───────────────────────────────────────── */
function ToggleStatusModal({ isOpen, onClose, user, onConfirm, loading }) {
  if (!user) return null;
  const willActivate = !user.isActive;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={willActivate ? 'Activate User' : 'Deactivate User'}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={willActivate ? 'primary' : 'danger'}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {willActivate ? 'Yes, Activate' : 'Yes, Deactivate'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {willActivate
                ? 'This will restore the user\'s access to the platform.'
                : 'This will prevent the user from logging in.'}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              User:{' '}
              <strong>
                {user.firstName} {user.lastName}
              </strong>{' '}
              ({user.email})
            </p>
          </div>
        </div>
        <p className="text-sm text-surface-500">
          You can reverse this action at any time from the User Management page.
        </p>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AdminUsers() {
  const queryClient = useQueryClient();

  /* ── filter state ── */
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [limit, setLimit]       = useState(20);
  const [page, setPage]         = useState(1);

  /* ── committed search (submit on Enter or after debounce) ── */
  const [committedSearch, setCommittedSearch] = useState('');

  /* ── modal state ── */
  const [toggleTarget, setToggleTarget] = useState(null);

  /* ── query ── */
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adminUsers', page, committedSearch, role, limit],
    queryFn: () =>
      api.get('/admin/users', {
        params: { page, limit, role, search: committedSearch },
      }),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });

  const users      = data?.data?.data ?? [];
  const pagination = data?.data?.pagination ?? {};
  const totalPages = pagination.totalPages ?? 1;
  const totalItems = pagination.total ?? users.length;

  /* ── toggle mutation ── */
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      api.put(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setToggleTarget(null);
    },
  });

  /* ── handlers ── */
  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      setPage(1);
      setCommittedSearch(search);
    }
  }

  function handleSearchBlur() {
    setPage(1);
    setCommittedSearch(search);
  }

  function handleRoleChange(e) {
    setRole(e.target.value);
    setPage(1);
  }

  function handleLimitChange(e) {
    setLimit(Number(e.target.value));
    setPage(1);
  }

  function handleToggleConfirm() {
    if (!toggleTarget) return;
    toggleMutation.mutate({ id: toggleTarget.id, isActive: !toggleTarget.isActive });
  }

  /* ── pagination range ── */
  const pageRange = [];
  const delta = 2;
  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i++
  ) {
    pageRange.push(i);
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-5 w-px bg-surface-200" />
            <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              User Management
            </h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Filters bar ── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white transition-all placeholder:text-surface-400"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-surface-600 whitespace-nowrap">Role</label>
              <select
                value={role}
                onChange={handleRoleChange}
                className="text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Per page */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-surface-600 whitespace-nowrap">Per page</label>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Results count */}
            {!isLoading && (
              <span className="text-sm text-surface-400 ml-auto">
                {totalItems.toLocaleString()} user{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-surface-600 font-medium">Failed to load users</p>
              <Button variant="secondary" leftIcon={RefreshCw} size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="w-10 h-10 text-surface-300" />
              <p className="text-surface-500 font-medium">No users found</p>
              <p className="text-surface-400 text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">User</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Email</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Role</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Joined</th>
                    <th className="text-right px-6 py-3 font-medium text-surface-500 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((u) => {
                    const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-surface-50 transition-colors duration-100"
                      >
                        {/* Avatar + Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={fullName} size="sm" />
                            <span className="font-medium text-surface-800">{fullName}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-surface-600 whitespace-nowrap">
                          {u.email}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={u.role} />
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.isActive ? (
                            <Badge variant="success" dot>Active</Badge>
                          ) : (
                            <Badge variant="danger" dot>Inactive</Badge>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-6 py-4 text-surface-500 whitespace-nowrap">
                          {fmtDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setToggleTarget(u)}
                            title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            className={[
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                              u.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300',
                            ].join(' ')}
                          >
                            {u.isActive ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
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
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageRange[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-sm text-surface-600 hover:bg-surface-100 transition-all"
                  >
                    1
                  </button>
                  {pageRange[0] > 2 && (
                    <span className="w-9 h-9 flex items-center justify-center text-surface-400 text-sm">
                      …
                    </span>
                  )}
                </>
              )}

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

              {pageRange[pageRange.length - 1] < totalPages && (
                <>
                  {pageRange[pageRange.length - 1] < totalPages - 1 && (
                    <span className="w-9 h-9 flex items-center justify-center text-surface-400 text-sm">
                      …
                    </span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-sm text-surface-600 hover:bg-surface-100 transition-all"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toggle Status Modal ── */}
      <ToggleStatusModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        user={toggleTarget}
        loading={toggleMutation.isPending}
        onConfirm={handleToggleConfirm}
      />
    </div>
  );
}
