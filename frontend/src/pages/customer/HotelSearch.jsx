import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button, Badge, StarRating } from '../../components/ui';

/* ─────────────────────────────────────────
   Hotel Card
───────────────────────────────────────── */
function HotelCard({ hotel }) {
  const navigate = useNavigate();
  const lowestPrice = hotel.startingPrice ?? (hotel.rooms?.length
    ? Math.min(...hotel.rooms.map((r) => r.pricePerNight))
    : null);

  return (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group flex flex-col sm:flex-row lg:flex-col animate-fade-in">
      {/* Image */}
      <div className="relative h-48 sm:w-52 sm:h-auto lg:w-full lg:h-48 flex-shrink-0 overflow-hidden">
        {hotel.thumbnail ? (
          <img
            src={hotel.thumbnail}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/40" />
          </div>
        )}
        {hotel.stars > 0 && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" size="sm">
              {'★'.repeat(hotel.stars)} {hotel.stars}-Star
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-surface-900 text-base line-clamp-1">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-surface-500 text-sm">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {hotel.city}, {hotel.country}
          </span>
        </div>

        {hotel.avgRating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating value={hotel.avgRating} size="sm" readOnly />
            <span className="text-xs text-surface-500">
              {hotel.avgRating.toFixed(1)} ({hotel.reviewCount ?? 0} reviews)
            </span>
          </div>
        )}

        {hotel.description && (
          <p className="text-xs text-surface-500 mt-2 line-clamp-2 flex-1">
            {hotel.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
          {lowestPrice !== null ? (
            <div>
              <span className="text-xs text-surface-400">From</span>
              <p className="text-primary-700 font-bold text-lg leading-none">
                ${lowestPrice}
                <span className="text-xs font-normal text-surface-400">/night</span>
              </p>
            </div>
          ) : (
            <span className="text-sm text-surface-400">Price on request</span>
          )}
          <Button size="sm" onClick={() => navigate(`/hotels/${hotel.id}`)}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="h-48 bg-surface-200 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-200 rounded animate-shimmer w-3/4" />
        <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/2" />
        <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/3" />
        <div className="h-3 bg-surface-200 rounded animate-shimmer w-full" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-surface-200 rounded animate-shimmer w-20" />
          <div className="h-8 bg-surface-200 rounded animate-shimmer w-24" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Filter Panel
───────────────────────────────────────── */
function FilterPanel({ filters, onChange, onApply, onClear }) {
  const starOptions = [5, 4, 3, 2, 1];

  function toggleStar(star) {
    const current = filters.stars ? filters.stars.split(',').map(Number) : [];
    const updated = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    onChange('stars', updated.length ? updated.sort((a, b) => b - a).join(',') : '');
  }

  const selectedStars = filters.stars
    ? filters.stars.split(',').map(Number)
    : [];

  return (
    <div className="space-y-6">
      {/* City / Destination */}
      <div>
        <label className="block text-sm font-semibold text-surface-800 mb-2">
          Destination
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="City name"
            value={filters.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white text-surface-800 placeholder:text-surface-400"
          />
        </div>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-semibold text-surface-800 mb-2">
          Star Rating
        </label>
        <div className="space-y-2">
          {starOptions.map((star) => (
            <label
              key={star}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedStars.includes(star)}
                onChange={() => toggleStar(star)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-400"
              />
              <span className="flex items-center gap-1 text-sm text-surface-700 group-hover:text-surface-900">
                {Array.from({ length: star }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
                ))}
                <span className="ml-1">({star} star{star !== 1 ? 's' : ''})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-surface-800 mb-2">
          Price Range (per night)
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
              $
            </span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onChange('minPrice', e.target.value)}
              min={0}
              className="w-full pl-7 pr-2 py-2.5 text-sm rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white text-surface-800 placeholder:text-surface-400"
            />
          </div>
          <span className="text-surface-400 text-sm">–</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
              $
            </span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              min={0}
              className="w-full pl-7 pr-2 py-2.5 text-sm rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white text-surface-800 placeholder:text-surface-400"
            />
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-semibold text-surface-800 mb-2">
          Sort By
        </label>
        <select
          value={filters.sort || ''}
          onChange={(e) => onChange('sort', e.target.value)}
          className="w-full py-2.5 px-3 text-sm rounded-xl border border-surface-200 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white text-surface-800"
        >
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Top Rated</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={onApply} fullWidth>
          Apply Filters
        </Button>
        <Button variant="secondary" onClick={onClear} fullWidth>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Pagination
───────────────────────────────────────── */
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showEllipsisStart = page > 4;
  const showEllipsisEnd = page < totalPages - 3;

  if (showEllipsisStart) {
    pages.push(1, '...');
    for (let i = page - 1; i <= Math.min(page + 1, totalPages); i++) pages.push(i);
  } else {
    for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i);
  }

  if (showEllipsisEnd && !pages.includes(totalPages)) {
    pages.push('...', totalPages);
  } else if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-surface-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
              p === page
                ? 'bg-primary-600 text-white border border-primary-600'
                : 'border border-surface-200 text-surface-700 hover:bg-surface-100',
            ].join(' ')}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function HotelSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local filter state (mirrors URL params, staged until "Apply")
  const [localFilters, setLocalFilters] = useState({
    city: searchParams.get('city') || '',
    stars: searchParams.get('stars') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '',
  });

  // Sync local state when URL changes externally (e.g. browser back)
  useEffect(() => {
    setLocalFilters({
      city: searchParams.get('city') || '',
      stars: searchParams.get('stars') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || '',
    });
  }, [searchParams]);

  const page = Number(searchParams.get('page') || '1');
  const limit = 12;

  // Build query params from URL
  const queryParams = {
    city: searchParams.get('city') || undefined,
    country: searchParams.get('country') || undefined,
    checkIn: searchParams.get('checkIn') || undefined,
    checkOut: searchParams.get('checkOut') || undefined,
    guests: searchParams.get('guests') || undefined,
    stars: searchParams.get('stars') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    sort: searchParams.get('sort') || undefined,
    page,
    limit,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hotels', queryParams],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      return api.get(`/hotels?${params.toString()}`);
    },
    keepPreviousData: true,
  });

  const hotels = data?.data?.data ?? [];
  const pagination = data?.data?.pagination ?? {};
  const totalCount = pagination.total ?? 0;
  const totalPages = pagination.totalPages ?? Math.ceil(totalCount / limit);

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  function applyFilters() {
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');

    Object.entries(localFilters).forEach(([k, v]) => {
      if (v) {
        next.set(k, v);
      } else {
        next.delete(k);
      }
    });

    setSearchParams(next);
    setDrawerOpen(false);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    // Keep checkIn/checkOut/guests from URL
    ['checkIn', 'checkOut', 'guests'].forEach((k) => {
      if (searchParams.get(k)) next.set(k, searchParams.get(k));
    });
    next.set('page', '1');
    setSearchParams(next);
    setLocalFilters({ city: '', stars: '', minPrice: '', maxPrice: '', sort: '' });
    setDrawerOpen(false);
  }

  function changePage(newPage) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hasActiveFilters =
    searchParams.get('city') ||
    searchParams.get('stars') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    searchParams.get('sort');

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Search header bar */}
      <div className="bg-white border-b border-surface-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-surface-400 flex-shrink-0" />
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {searchParams.get('city') && (
              <Badge variant="primary" size="sm">
                {searchParams.get('city')}
              </Badge>
            )}
            {searchParams.get('checkIn') && (
              <Badge variant="default" size="sm">
                {searchParams.get('checkIn')}
              </Badge>
            )}
            {searchParams.get('checkOut') && (
              <span className="text-surface-400 text-xs">→</span>
            )}
            {searchParams.get('checkOut') && (
              <Badge variant="default" size="sm">
                {searchParams.get('checkOut')}
              </Badge>
            )}
            {searchParams.get('guests') && (
              <Badge variant="default" size="sm">
                {searchParams.get('guests')} guest{searchParams.get('guests') !== '1' ? 's' : ''}
              </Badge>
            )}
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary-600" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-surface-900 text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel
                filters={localFilters}
                onChange={handleFilterChange}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* ── Mobile filter drawer ── */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
                onClick={() => setDrawerOpen(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col animate-slide-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
                  <h2 className="font-semibold text-surface-900 text-base">
                    Filter Hotels
                  </h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FilterPanel
                    filters={localFilters}
                    onChange={handleFilterChange}
                    onApply={applyFilters}
                    onClear={clearFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              {isLoading ? (
                <div className="h-5 w-40 bg-surface-200 rounded animate-shimmer" />
              ) : (
                <p className="text-surface-600 text-sm">
                  <span className="font-semibold text-surface-900">{totalCount}</span>{' '}
                  {totalCount === 1 ? 'hotel' : 'hotels'} found
                  {searchParams.get('city') && (
                    <span> in <strong>{searchParams.get('city')}</strong></span>
                  )}
                </p>
              )}
              {hasActiveFilters && !isLoading && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Error state */}
            {isError && (
              <div className="flex flex-col items-center py-20 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-surface-600 font-medium">Failed to load hotels</p>
                <p className="text-surface-400 text-sm mt-1">
                  Please check your connection and try again.
                </p>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && hotels.length === 0 && (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-5">
                  <Search className="w-10 h-10 text-surface-300" />
                </div>
                <h3 className="text-lg font-semibold text-surface-800 mb-2">
                  No hotels found
                </h3>
                <p className="text-surface-400 text-sm max-w-xs mb-6">
                  We couldn't find any hotels matching your current filters. Try
                  adjusting your search criteria.
                </p>
                <Button variant="secondary" onClick={clearFilters} leftIcon={X}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Hotel grid */}
            {!isLoading && !isError && hotels.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={changePage}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
