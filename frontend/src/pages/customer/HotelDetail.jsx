import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Heart,
  HeartOff,
  Users,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Check,
  AlertCircle,
  Wifi,
  Coffee,
  Car,
  Wind,
  Dumbbell,
  Utensils,
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  Badge,
  Modal,
  StarRating,
  Avatar,
  Spinner,
} from '../../components/ui';

/* ─────────────────────────────────────────
   Amenity icon map
───────────────────────────────────────── */
const AMENITY_ICONS = {
  wifi: Wifi,
  coffee: Coffee,
  parking: Car,
  'air conditioning': Wind,
  gym: Dumbbell,
  restaurant: Utensils,
};

function AmenityIcon({ name }) {
  const key = name.toLowerCase();
  const Icon = Object.entries(AMENITY_ICONS).find(([k]) => key.includes(k))?.[1];
  if (!Icon) return null;
  return <Icon className="w-4 h-4" aria-hidden="true" />;
}

/* ─────────────────────────────────────────
   Image Gallery
───────────────────────────────────────── */
function ImageGallery({ images, thumbnail, name }) {
  const allImages = [
    ...(thumbnail ? [thumbnail] : []),
    ...(images || []).filter((img) => img !== thumbnail),
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  function prev() {
    setActiveIdx((i) => (i === 0 ? allImages.length - 1 : i - 1));
  }
  function next() {
    setActiveIdx((i) => (i === allImages.length - 1 ? 0 : i + 1));
  }

  if (allImages.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-700 to-primary-500 h-80 sm:h-96 flex items-center justify-center">
        <MapPin className="w-16 h-16 text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden group">
        <img
          src={allImages[activeIdx]}
          alt={`${name} - image ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />
        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {activeIdx + 1} / {allImages.length}
        </div>
        {/* Nav arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={[
                'flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150',
                idx === activeIdx
                  ? 'border-primary-500 ring-2 ring-primary-300'
                  : 'border-transparent hover:border-surface-300',
              ].join(' ')}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={img}
                alt={`${name} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Room Card
───────────────────────────────────────── */
function RoomCard({ room, hotel, navigate }) {
  return (
    <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 hover:border-primary-200 hover:shadow-card transition-all duration-200">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 text-base">
              {room.name}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="default" size="sm">
                {room.type}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <Users className="w-3.5 h-3.5" />
                Up to {room.capacity} guests
              </span>
            </div>
          </div>
          {room.isActive === false && (
            <Badge variant="danger" size="sm">
              Unavailable
            </Badge>
          )}
        </div>
        {room.description && (
          <p className="text-sm text-surface-500 mt-2 leading-relaxed">
            {room.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end justify-between gap-3 min-w-[140px]">
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-700">
            ${room.pricePerNight}
          </p>
          <p className="text-xs text-surface-400">per night</p>
        </div>
        <Button
          size="sm"
          disabled={room.isActive === false}
          onClick={() => {
            localStorage.setItem('checkoutData', JSON.stringify({ hotel, room }));
            navigate(`/checkout/${room.id}`);
          }}
          leftIcon={BedDouble}
        >
          {room.isActive !== false ? 'Book Now' : 'Unavailable'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Review Card
───────────────────────────────────────── */
function ReviewCard({ review }) {
  const name = `${review.user?.firstName ?? ''} ${review.user?.lastName ?? ''}`.trim() || 'Guest';
  return (
    <div className="bg-surface-50 rounded-2xl p-5 border border-surface-100">
      <div className="flex items-start gap-3">
        <Avatar
          src={review.user?.avatar}
          name={name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-surface-900 text-sm">{name}</p>
            <StarRating value={review.rating} size="sm" readOnly />
          </div>
          <p className="text-surface-600 text-sm mt-2 leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Write Review Modal
───────────────────────────────────────── */
function WriteReviewModal({ isOpen, onClose, hotelId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/reviews', { hotelId, rating, comment }),
    onSuccess: () => {
      setRating(0);
      setComment('');
      setError('');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message ?? 'Failed to submit review. Please try again.',
      );
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Write a Review"
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Submit Review
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Your Rating
          </label>
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience at this hotel..."
            className="w-full px-4 py-3 text-sm text-surface-800 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:bg-white placeholder:text-surface-400 resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Fetch hotel details
  const {
    data: hotelData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => api.get(`/hotels/${id}`),
    staleTime: 2 * 60 * 1000,
  });

  const hotel = hotelData?.data?.data;

  // Fetch favorites to determine if this hotel is favorited
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites'),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const favorites = favData?.data?.data ?? [];
  const isFavorited = favorites.some((f) => f.hotelId === id || f.hotelId === hotel?.id);

  // Add favorite mutation
  const addFavMutation = useMutation({
    mutationFn: () => api.post(`/favorites/${hotel?.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  // Remove favorite mutation
  const removeFavMutation = useMutation({
    mutationFn: () => api.post(`/favorites/${hotel?.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  function toggleFavorite() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isFavorited) {
      removeFavMutation.mutate();
    } else {
      addFavMutation.mutate();
    }
  }

  const favLoading = addFavMutation.isPending || removeFavMutation.isPending;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-96 bg-surface-200 rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-surface-200 rounded animate-shimmer w-2/3" />
            <div className="h-4 bg-surface-200 rounded animate-shimmer w-1/3" />
            <div className="h-24 bg-surface-200 rounded animate-shimmer w-full" />
          </div>
          <div className="h-48 bg-surface-200 rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError || !hotel) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-surface-800 mb-2">
          Hotel not found
        </h2>
        <p className="text-surface-500 mb-6">
          This hotel may have been removed or doesn't exist.
        </p>
        <Button onClick={() => navigate('/hotels')}>
          Browse Hotels
        </Button>
      </div>
    );
  }

  const rooms = hotel.rooms ?? [];
  const reviews = hotel.reviews ?? [];
  const amenities = hotel.amenities ?? [];
  const availableRooms = rooms.filter((r) => r.isActive !== false);

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to results
        </button>

        {/* ── Image Gallery ── */}
        <div className="mb-8">
          <ImageGallery
            images={hotel.images}
            thumbnail={hotel.thumbnail}
            name={hotel.name}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: main info ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel info header */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 leading-tight">
                    {hotel.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-surface-500 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {hotel.address && `${hotel.address}, `}
                        {hotel.city}, {hotel.country}
                      </span>
                    </div>
                    {hotel.stars > 0 && (
                      <Badge variant="warning">
                        {'★'.repeat(hotel.stars)} {hotel.stars}-Star Hotel
                      </Badge>
                    )}
                  </div>

                  {hotel.avgRating > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <StarRating value={hotel.avgRating} size="md" readOnly />
                      <span className="text-sm font-semibold text-surface-700">
                        {hotel.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-surface-400">
                        ({hotel.reviewCount ?? reviews.length} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Favorite button */}
                <button
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={[
                    'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                    isFavorited
                      ? 'bg-red-50 border-red-300 text-red-500 hover:bg-red-100'
                      : 'bg-surface-50 border-surface-200 text-surface-400 hover:border-red-300 hover:text-red-400',
                    favLoading ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited ? (
                    <Heart className="w-5 h-5 fill-current" />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                </button>
              </div>

              {hotel.description && (
                <p className="text-surface-600 text-sm leading-relaxed mt-4 border-t border-surface-100 pt-4">
                  {hotel.description}
                </p>
              )}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium"
                    >
                      <AmenityIcon name={amenity} />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-surface-900">
                  Available Rooms
                </h2>
                {availableRooms.length > 0 && (
                  <Badge variant="success" dot>
                    {availableRooms.length} available
                  </Badge>
                )}
              </div>

              {rooms.length === 0 ? (
                <p className="text-surface-400 text-sm text-center py-8">
                  No rooms listed for this hotel.
                </p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      hotel={hotel}
                      navigate={navigate}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900">
                    Guest Reviews
                  </h2>
                  {hotel.avgRating > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-surface-900">
                        {hotel.avgRating.toFixed(1)}
                      </span>
                      <div>
                        <StarRating value={hotel.avgRating} size="sm" readOnly />
                        <p className="text-xs text-surface-400 mt-0.5">
                          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={MessageSquare}
                    onClick={() => setReviewModalOpen(true)}
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-10 h-10 text-surface-200 mx-auto mb-3" />
                  <p className="text-surface-400 text-sm">
                    No reviews yet. Be the first to review!
                  </p>
                  {!user && (
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-2 text-primary-600 text-sm hover:underline"
                    >
                      Login to write a review
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: quick summary sidebar ── */}
          <aside className="space-y-5">
            {/* Price summary */}
            {rooms.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-5 sticky top-24">
                <div className="text-center border-b border-surface-100 pb-4 mb-4">
                  <p className="text-xs text-surface-400 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-primary-700">
                    ${Math.min(...rooms.map((r) => r.pricePerNight))}
                  </p>
                  <p className="text-xs text-surface-400">per night</p>
                </div>

                <div className="space-y-2 mb-4">
                  {hotel.stars > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Classification</span>
                      <span className="font-medium text-surface-800">
                        {'★'.repeat(hotel.stars)} {hotel.stars}-Star
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">Room types</span>
                    <span className="font-medium text-surface-800">
                      {rooms.length}
                    </span>
                  </div>
                  {availableRooms.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Available now</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  fullWidth
                  onClick={() => {
                    const el = document.getElementById('rooms-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Rooms
                </Button>

                <button
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={[
                    'w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                    isFavorited
                      ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100'
                      : 'border-surface-200 text-surface-600 hover:border-red-300 hover:text-red-400',
                  ].join(' ')}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`}
                  />
                  {isFavorited ? 'Saved to Favorites' : 'Save to Favorites'}
                </button>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-surface-900 text-sm mb-3">
                Location
              </h3>
              <div className="bg-surface-100 rounded-xl h-32 flex items-center justify-center mb-3">
                <div className="text-center text-surface-400">
                  <MapPin className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Map view</p>
                </div>
              </div>
              <p className="text-sm text-surface-600">
                {hotel.address && <span className="block">{hotel.address}</span>}
                <span>
                  {hotel.city}, {hotel.country}
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Review Modal */}
      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        hotelId={hotel.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['hotel', id] });
        }}
      />
    </div>
  );
}
