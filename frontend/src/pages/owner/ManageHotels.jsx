import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  DoorOpen,
  X,
  ChevronRight,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button, Modal, Badge, Spinner, StarRating } from '../../components/ui';

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const AMENITY_SUGGESTIONS = [
  'WiFi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar',
  'Concierge', 'Room Service', 'Airport Shuttle', 'Pet Friendly', 'Business Center',
];

const EMPTY_FORM = {
  name: '',
  description: '',
  address: '',
  city: '',
  country: '',
  stars: 0,
  amenities: [],
  thumbnail: '',
};

/* ─────────────────────────────────────────
   API helpers
───────────────────────────────────────── */
async function fetchMyHotels() {
  const { data } = await api.get('/hotels/owner/my-hotels');
  return data?.data ?? [];
}

async function createHotel(body) {
  const { data } = await api.post('/hotels', body);
  return data;
}

async function updateHotel({ id, ...body }) {
  const { data } = await api.put(`/hotels/${id}`, body);
  return data;
}

async function deleteHotel(id) {
  const { data } = await api.delete(`/hotels/${id}`);
  return data;
}

/* ─────────────────────────────────────────
   Tag / amenity input
───────────────────────────────────────── */
function AmenityInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const filtered = AMENITY_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s),
  );

  function addTag(tag) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-surface-700 mb-1.5">
        Amenities
      </label>
      <div
        className={[
          'flex flex-wrap gap-1.5 p-2.5 min-h-[44px]',
          'w-full rounded-xl border border-surface-200 bg-surface-100',
          'focus-within:ring-2 focus-within:ring-primary-500/25 focus-within:border-primary-400 focus-within:bg-white',
          'transition-all duration-150',
        ].join(' ')}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-primary-900 focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Type amenity + Enter…' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && input.length > 0 && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s);
                }}
                className="w-full text-left px-4 py-2 text-sm text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-100"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Quick-add suggestion chips (always visible when no input) */}
      {value.length === 0 && !input && (
        <p className="mt-1.5 text-xs text-surface-400">
          Suggestions:{' '}
          {AMENITY_SUGGESTIONS.slice(0, 5).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="underline text-primary-500 hover:text-primary-700 mr-1"
            >
              {s}{i < 4 ? ',' : ''}
            </button>
          ))}
          …
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Image upload input
───────────────────────────────────────── */
function ImageUpload({ value, onChange, label = 'Thumbnail Image' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.data?.url ?? res?.data?.url;
      if (url) onChange(url);
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      // reset so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const previewSrc = value
    ? value.startsWith('http') ? value : `${api.defaults.baseURL?.replace('/api', '')}${value}`
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-surface-700">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="w-24 h-20 rounded-xl border border-surface-200 bg-surface-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {previewSrc ? (
            <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-8 h-8 text-surface-300" />
          )}
        </div>
        {/* Controls */}
        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFile}
            className="hidden"
            id="hotel-thumbnail-upload"
          />
          <label
            htmlFor="hotel-thumbnail-upload"
            className={[
              'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border cursor-pointer transition-all duration-150',
              uploading
                ? 'opacity-60 cursor-not-allowed border-surface-200 text-surface-400 bg-surface-100'
                : 'border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100',
            ].join(' ')}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {uploading ? 'Uploading…' : value ? 'Change Image' : 'Upload Image'}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          )}
          <p className="text-xs text-surface-400">JPG, PNG, WebP — max 5 MB</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Hotel form (shared create / edit)
───────────────────────────────────────── */
function HotelForm({ initial = EMPTY_FORM, onSubmit, submitting }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  // Sync when editing a different hotel
  useEffect(() => {
    setForm(initial);
    setErrors({});
  }, [initial]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.country.trim()) e.country = 'Country is required.';
    if (!form.stars || form.stars < 1) e.stars = 'Please select a star rating.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit(form);
  }

  return (
    <form id="hotel-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="h-name" className="text-sm font-medium text-surface-700">
          Hotel Name <span className="text-red-500">*</span>
        </label>
        <input
          id="h-name"
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Grand Palace Hotel"
          className={[
            'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
            'placeholder:text-surface-400 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.name
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
              : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
          ].join(' ')}
        />
        {errors.name && <p className="text-xs font-medium text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="h-desc" className="text-sm font-medium text-surface-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="h-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="A luxurious hotel in the heart of the city…"
          className={[
            'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
            'placeholder:text-surface-400 resize-none transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.description
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
              : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
          ].join(' ')}
        />
        {errors.description && <p className="text-xs font-medium text-red-600">{errors.description}</p>}
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="h-addr" className="text-sm font-medium text-surface-700">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          id="h-addr"
          type="text"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="123 Luxury Boulevard"
          className={[
            'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
            'placeholder:text-surface-400 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.address
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
              : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
          ].join(' ')}
        />
        {errors.address && <p className="text-xs font-medium text-red-600">{errors.address}</p>}
      </div>

      {/* City + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="h-city" className="text-sm font-medium text-surface-700">
            City <span className="text-red-500">*</span>
          </label>
          <input
            id="h-city"
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Paris"
            className={[
              'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
              'placeholder:text-surface-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.city
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
                : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            ].join(' ')}
          />
          {errors.city && <p className="text-xs font-medium text-red-600">{errors.city}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="h-country" className="text-sm font-medium text-surface-700">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            id="h-country"
            type="text"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="France"
            className={[
              'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
              'placeholder:text-surface-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.country
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
                : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            ].join(' ')}
          />
          {errors.country && <p className="text-xs font-medium text-red-600">{errors.country}</p>}
        </div>
      </div>

      {/* Stars */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-surface-700">
          Star Rating <span className="text-red-500">*</span>
        </span>
        <div className="flex items-center gap-2">
          <StarRating
            value={form.stars}
            onChange={(v) => set('stars', v)}
            size="lg"
          />
          {form.stars > 0 && (
            <span className="text-sm text-surface-500">{form.stars} star{form.stars > 1 ? 's' : ''}</span>
          )}
        </div>
        {errors.stars && <p className="text-xs font-medium text-red-600">{errors.stars}</p>}
      </div>

      {/* Amenities */}
      <AmenityInput
        value={form.amenities}
        onChange={(tags) => set('amenities', tags)}
      />

      {/* Thumbnail */}
      <ImageUpload
        value={form.thumbnail}
        onChange={(url) => set('thumbnail', url)}
      />
    </form>
  );
}

/* ─────────────────────────────────────────
   Hotel card
───────────────────────────────────────── */
function HotelCard({ hotel, onEdit, onDelete }) {
  const navigate = useNavigate();
  const thumbnail = hotel.images?.[0];
  const isActive = hotel.isActive ?? hotel.status === 'active' ?? true;

  return (
    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-surface-100 to-surface-200 flex-shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-surface-300" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge variant={isActive ? 'success' : 'default'} dot>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Name + stars */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-surface-900 text-base leading-snug line-clamp-2">
            {hotel.name}
          </h3>
          {hotel.stars > 0 && (
            <StarRating value={hotel.stars} size="sm" readOnly />
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-surface-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{hotel.city}, {hotel.country}</span>
        </div>

        {/* Room count */}
        {hotel.rooms !== undefined && (
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <DoorOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {Array.isArray(hotel.rooms)
                ? hotel.rooms.length
                : (hotel.roomCount ?? hotel.rooms ?? 0)}{' '}
              room{(Array.isArray(hotel.rooms) ? hotel.rooms.length : (hotel.roomCount ?? hotel.rooms ?? 0)) !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-surface-100">
          <Button
            size="sm"
            variant="primary"
            fullWidth
            rightIcon={ChevronRight}
            onClick={() => navigate(`/owner/hotels/${hotel._id ?? hotel.id}/rooms`)}
          >
            Manage Rooms
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              fullWidth
              leftIcon={Pencil}
              onClick={() => onEdit(hotel)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              fullWidth
              leftIcon={Trash2}
              onClick={() => onDelete(hotel)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
export default function ManageHotels() {
  const queryClient = useQueryClient();

  // Modal states
  const [formModal, setFormModal] = useState({ open: false, hotel: null }); // null = create
  const [deleteModal, setDeleteModal] = useState({ open: false, hotel: null });

  /* ── Queries ── */
  const {
    data: hotels = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myHotels'],
    queryFn: fetchMyHotels,
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: createHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
      toast.success('Hotel created successfully!');
      setFormModal({ open: false, hotel: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create hotel.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
      toast.success('Hotel updated successfully!');
      setFormModal({ open: false, hotel: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update hotel.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
      toast.success('Hotel deleted.');
      setDeleteModal({ open: false, hotel: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete hotel.');
    },
  });

  /* ── Handlers ── */
  function openCreate() {
    setFormModal({ open: true, hotel: null });
  }

  function openEdit(hotel) {
    setFormModal({ open: true, hotel });
  }

  function openDelete(hotel) {
    setDeleteModal({ open: true, hotel });
  }

  function handleFormSubmit(formData) {
    if (formModal.hotel) {
      updateMutation.mutate({ id: formModal.hotel._id ?? formModal.hotel.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleConfirmDelete() {
    if (!deleteModal.hotel) return;
    deleteMutation.mutate(deleteModal.hotel._id ?? deleteModal.hotel.id);
  }

  const isEditing = Boolean(formModal.hotel);
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  /* ── Initial form values when editing ── */
  const editInitial = formModal.hotel
    ? {
        name: formModal.hotel.name ?? '',
        description: formModal.hotel.description ?? '',
        address: formModal.hotel.address ?? '',
        city: formModal.hotel.city ?? '',
        country: formModal.hotel.country ?? '',
        stars: formModal.hotel.stars ?? 0,
        amenities: formModal.hotel.amenities ?? [],
        thumbnail: formModal.hotel.thumbnail ?? formModal.hotel.images?.[0] ?? '',
      }
    : EMPTY_FORM;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-surface-900 tracking-tight">
              My Hotels
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Manage your hotel portfolio and rooms.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={openCreate}
          >
            Add Hotel
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-surface-400 font-medium">Loading hotels…</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-base font-semibold text-surface-700">Failed to load hotels</p>
            <p className="text-sm text-surface-500">
              {error?.response?.data?.message ?? error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && hotels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-surface-700">No hotels yet</p>
              <p className="text-sm text-surface-500 mt-1">
                Add your first hotel to start accepting bookings.
              </p>
            </div>
            <Button variant="primary" leftIcon={Plus} onClick={openCreate}>
              Add Your First Hotel
            </Button>
          </div>
        )}

        {/* Hotel grid */}
        {!isLoading && !isError && hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel._id ?? hotel.id}
                hotel={hotel}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Hotel Modal ── */}
      <Modal
        isOpen={formModal.open}
        onClose={() => !formSubmitting && setFormModal({ open: false, hotel: null })}
        title={isEditing ? 'Edit Hotel' : 'Add New Hotel'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setFormModal({ open: false, hotel: null })}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="hotel-form"
              variant="primary"
              loading={formSubmitting}
            >
              {isEditing ? 'Save Changes' : 'Create Hotel'}
            </Button>
          </div>
        }
      >
        <HotelForm
          key={formModal.hotel?._id ?? formModal.hotel?.id ?? 'create'}
          initial={editInitial}
          onSubmit={handleFormSubmit}
          submitting={formSubmitting}
        />
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleteMutation.isPending && setDeleteModal({ open: false, hotel: null })}
        title="Delete Hotel"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, hotel: null })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Delete Hotel
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-surface-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-surface-900">
              {deleteModal.hotel?.name}
            </span>
            ? This action cannot be undone and will also remove all associated rooms.
          </p>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-medium text-red-700">
              All rooms and bookings for this hotel may be permanently affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
