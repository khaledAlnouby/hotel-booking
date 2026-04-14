import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  TrendingDown,
  Shield,
  Headphones,
  Search,
  Star,
  ChevronRight,
  Calendar,
  Users,
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
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group animate-fade-in">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
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
          <div className="absolute top-3 right-3">
            <Badge variant="warning" size="sm">
              {'★'.repeat(hotel.stars)}
            </Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-surface-900 text-base leading-snug line-clamp-1">
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
              ({hotel.reviewCount ?? 0})
            </span>
          </div>
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
          <Button
            size="sm"
            onClick={() => navigate(`/hotels/${hotel.id}`)}
          >
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
function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="h-48 bg-surface-200 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-200 rounded animate-shimmer w-3/4" />
        <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/2" />
        <div className="h-3 bg-surface-200 rounded animate-shimmer w-1/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-surface-200 rounded animate-shimmer w-20" />
          <div className="h-8 bg-surface-200 rounded animate-shimmer w-24" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Featured Cities data
───────────────────────────────────────── */
const CITIES = [
  { name: 'Paris', gradient: 'from-rose-500 to-pink-700', emoji: '🗼' },
  { name: 'New York', gradient: 'from-sky-600 to-blue-800', emoji: '🗽' },
  { name: 'Tokyo', gradient: 'from-red-500 to-orange-700', emoji: '🌸' },
  { name: 'Dubai', gradient: 'from-amber-500 to-yellow-700', emoji: '🏙️' },
  { name: 'London', gradient: 'from-slate-500 to-gray-700', emoji: '🎡' },
  { name: 'Bali', gradient: 'from-emerald-500 to-teal-700', emoji: '🌴' },
];

/* ─────────────────────────────────────────
   Why LuxStay feature data
───────────────────────────────────────── */
const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Best Prices',
    description:
      'We compare thousands of hotels to guarantee you the lowest rates, with no hidden fees or booking charges.',
  },
  {
    icon: Shield,
    title: 'Secure Booking',
    description:
      'Your payment and personal data are protected with enterprise-grade encryption. Book with confidence.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description:
      'Our dedicated support team is available around the clock to assist with any questions or booking changes.',
  },
];

/* ─────────────────────────────────────────
   How it Works steps
───────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Search',
    description: 'Enter your destination, travel dates and number of guests.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Choose',
    description: 'Browse curated hotels, read reviews and compare prices.',
    icon: Star,
  },
  {
    step: 3,
    title: 'Book',
    description: 'Secure your room in seconds with our seamless checkout.',
    icon: Calendar,
  },
  {
    step: 4,
    title: 'Enjoy',
    description: 'Check in with confidence and enjoy your perfect stay.',
    icon: Users,
  },
];

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  // Search state
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  // Featured hotels query
  const { data, isLoading } = useQuery({
    queryKey: ['featured-hotels'],
    queryFn: () => api.get('/hotels?limit=6&page=1'),
    staleTime: 5 * 60 * 1000,
  });

  const featuredHotels = data?.data?.data ?? [];

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('city', destination.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', String(guests));
    navigate(`/hotels?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="animate-fade-in">
            <Badge variant="primary" className="mb-4 bg-white/10 border-white/20 text-white">
              Over 10,000 hotels worldwide
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Find Your{' '}
              <span className="text-accent-300">Perfect Stay</span>
            </h1>
            <p className="text-primary-200 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
              Discover extraordinary hotels at unbeatable prices. Your dream
              vacation is just a search away.
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="animate-slide-up bg-white rounded-2xl shadow-glass p-3 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto"
          >
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Destination (city)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-3 text-sm text-surface-800 bg-surface-50 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 placeholder:text-surface-400"
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="date"
                placeholder="Check-in"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-3 text-sm text-surface-800 bg-surface-50 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="date"
                placeholder="Check-out"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-3 text-sm text-surface-800 bg-surface-50 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
            <div className="flex-1 relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              <input
                type="number"
                placeholder="Guests"
                value={guests}
                onChange={(e) =>
                  setGuests(Math.min(20, Math.max(1, Number(e.target.value))))
                }
                min={1}
                max={20}
                className="w-full pl-9 pr-3 py-3 text-sm text-surface-800 bg-surface-50 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
            <Button type="submit" size="lg" className="px-8 shrink-0">
              <Search className="w-4 h-4" />
              Search Hotels
            </Button>
          </form>
        </div>
      </section>

      {/* ── Featured Cities ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Popular Destinations
            </h2>
            <p className="text-surface-500 mt-1">
              Explore top cities loved by travelers
            </p>
          </div>
          <Link
            to="/hotels"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {CITIES.map((city) => (
            <div
              key={city.name}
              className="flex-shrink-0 w-44 snap-start group cursor-pointer"
              onClick={() => navigate(`/hotels?city=${city.name}`)}
            >
              <div
                className={`relative h-52 rounded-2xl bg-gradient-to-br ${city.gradient} overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 group-hover:scale-[1.02]`}
              >
                {/* Dark overlay for text */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-4xl mb-2">{city.emoji}</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-semibold text-sm">{city.name}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs bg-white/90 text-surface-800 font-medium px-3 py-1 rounded-full">
                    View Hotels
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Hotels ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Featured Hotels
            </h2>
            <p className="text-surface-500 mt-1">
              Handpicked stays for exceptional experiences
            </p>
          </div>
          <Link
            to="/hotels"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))
            : featuredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
        </div>

        {!isLoading && featuredHotels.length === 0 && (
          <div className="text-center py-16 text-surface-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No hotels available right now</p>
            <p className="text-sm mt-1">Check back soon for new listings</p>
          </div>
        )}
      </section>

      {/* ── Why LuxStay ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Why Choose LuxStay?
            </h2>
            <p className="text-surface-500 mt-2 max-w-xl mx-auto">
              We go above and beyond to make your travel experience seamless and
              memorable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="text-center p-8 rounded-2xl bg-surface-50 border border-surface-100 hover:border-primary-200 hover:shadow-card transition-all duration-200 group"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-200">
                  <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  {title}
                </h3>
                <p className="text-surface-500 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
            How It Works
          </h2>
          <p className="text-surface-500 mt-2 max-w-xl mx-auto">
            Booking your perfect hotel takes less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-0.5 bg-primary-100 z-0" />

          {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
            <div key={step} className="relative flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md mb-4">
                <Icon className="w-8 h-8" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary-100 border-2 border-primary-300 flex items-center justify-center text-primary-700 font-bold text-xs mb-3 -mt-1">
                {step}
              </div>
              <h3 className="text-base font-semibold text-surface-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-surface-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to find your perfect stay?
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            Join thousands of happy travelers who trust LuxStay every day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary-800 hover:bg-primary-50 border-0 px-8"
              onClick={() => navigate('/hotels')}
            >
              Browse Hotels
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 px-8"
              onClick={() => navigate('/register')}
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
