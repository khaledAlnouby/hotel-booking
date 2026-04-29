import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  DoorOpen,
  Pencil,
  Trash2,
  X,
  Users,
  CircleDollarSign,
  BedDouble,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import api from '../../lib/axios';
import { Button, Modal, Badge, Spinner } from '../../components/ui';

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'PENTHOUSE'];

const AMENITY_SUGGESTIONS = [
  'WiFi', 'Air Conditioning', 'Mini Bar', 'Safe', 'Bathtub', 'Sea View',
  'Balcony', 'Kitchen', 'Smart TV', 'Coffee Machine', 'Jacuzzi', 'Workspace',
];

const EMPTY_FORM = {
  name: '',
  type: 'SINGLE',
  description: '',
  price: '',
  capacity: '',
  amenities: [],
  images: [],
};

const ROOM_TYPE_COLORS = {
  SINGLE: 'info',
  DOUBLE: 'primary',
  SUITE: 'warning',
  DELUXE: 'success',
  PENTHOUSE: 'danger',
};

/* ─────────────────────────────────────────
   API helpers
───────────────────────────────────────── */
async function fetchHotelById(hotelId) {
  // Use the public hotel endpoint — ManageRooms is already behind an OWNER RoleRoute
  const { data } = await api.get(`/hotels/${hotelId}`);
  return data?.data ?? null;
}

async function fetchRooms(hotelId) {
  const { data } = await api.get(`/hotels/${hotelId}/rooms`);
  return data?.data ?? [];
}

async function createRoom({ hotelId, ...body }) {
  const { data } = await api.post(`/hotels/${hotelId}/rooms`, body);
  return data;
}

async function updateRoom({ id, ...body }) {
  const { data } = await api.put(`/rooms/${id}`, body);
  return data;
}

async function deleteRoom(id) {
  const { data } = await api.delete(`/rooms/${id}`);
  return data;
}

/* ─────────────────────────────────────────
   Amenity tag input
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
    </div>
  );
}

/* ─────────────────────────────────────────
   Image upload input
───────────────────────────────────────── */
function ImageUpload({ value = [], onChange }) {
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
      if (url) onChange([...value, url]);
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const baseUrl = api.defaults.baseURL?.replace('/api', '') ?? '';

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-surface-700">Room Images</label>
      <div className="flex flex-wrap gap-2">
        {value.map((url, idx) => {
          const src = url.startsWith('http') ? url : `${baseUrl}${url}`;
          return (
            <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden border border-surface-200 group">
              <img src={src} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          );
        })}
        {/* Upload button */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFile}
            className="hidden"
            id="room-image-upload"
          />
          <label
            htmlFor="room-image-upload"
            className={[
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border cursor-pointer transition-all duration-150',
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
            {uploading ? 'Uploading…' : 'Add Image'}
          </label>
        </div>
      </div>
      <p className="text-xs text-surface-400">JPG, PNG, WebP — max 5 MB each</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Room form (shared create / edit)
───────────────────────────────────────── */
function RoomForm({ initial = EMPTY_FORM, onSubmit }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

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
    if (!form.name.trim()) e.name = 'Room name is required.';
    if (!form.price || Number(form.price) < 1) e.price = 'Price must be at least 1.';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity must be at least 1.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const { price, ...rest } = form;
    onSubmit({
      ...rest,
      pricePerNight: Number(price),
      capacity: Number(form.capacity),
    });
  }

  return (
    <form id="room-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-name" className="text-sm font-medium text-surface-700">
          Room Name <span className="text-red-500">*</span>
        </label>
        <input
          id="r-name"
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Deluxe King Room"
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

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-type" className="text-sm font-medium text-surface-700">
          Room Type
        </label>
        <select
          id="r-type"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          className={[
            'w-full rounded-xl border border-surface-200 bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            'transition-all duration-150 cursor-pointer',
          ].join(' ')}
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-desc" className="text-sm font-medium text-surface-700">
          Description
        </label>
        <textarea
          id="r-desc"
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Spacious room with king-size bed and city views…"
          className={[
            'w-full rounded-xl border border-surface-200 bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
            'placeholder:text-surface-400 resize-none transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
          ].join(' ')}
        />
      </div>

      {/* Price + Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="r-price" className="text-sm font-medium text-surface-700">
            Price / Night ($) <span className="text-red-500">*</span>
          </label>
          <input
            id="r-price"
            type="number"
            min="1"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="150"
            className={[
              'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
              'placeholder:text-surface-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.price
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
                : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            ].join(' ')}
          />
          {errors.price && <p className="text-xs font-medium text-red-600">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="r-cap" className="text-sm font-medium text-surface-700">
            Capacity <span className="text-red-500">*</span>
          </label>
          <input
            id="r-cap"
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            placeholder="2"
            className={[
              'w-full rounded-xl border bg-surface-100 py-2.5 px-4 text-sm text-surface-800',
              'placeholder:text-surface-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.capacity
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300/30'
                : 'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            ].join(' ')}
          />
          {errors.capacity && <p className="text-xs font-medium text-red-600">{errors.capacity}</p>}
        </div>
      </div>

      {/* Amenities */}
      <AmenityInput
        value={form.amenities}
        onChange={(tags) => set('amenities', tags)}
      />

      {/* Images */}
      <ImageUpload
        value={form.images}
        onChange={(imgs) => set('images', imgs)}
      />
    </form>
  );
}

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
export default function ManageRooms() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [formModal, setFormModal] = useState({ open: false, room: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, room: null });

  /* ── Hotel details ── */
  const {
    data: hotel,
    isLoading: hotelLoading,
  } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => fetchHotelById(hotelId),
    // Pre-populate from nav state if available
    initialData: location.state?.hotel ?? undefined,
  });

  /* ── Rooms query ── */
  const {
    data: rooms = [],
    isLoading: roomsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['rooms', hotelId],
    queryFn: () => fetchRooms(hotelId),
    enabled: Boolean(hotelId),
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (body) => createRoom({ hotelId, ...body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
      toast.success('Room created successfully!');
      setFormModal({ open: false, room: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create room.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', hotelId] });
      toast.success('Room updated successfully!');
      setFormModal({ open: false, room: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update room.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
      toast.success('Room deleted.');
      setDeleteModal({ open: false, room: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete room.');
    },
  });

  /* ── Handlers ── */
  function openCreate() {
    setFormModal({ open: false, room: null });
    // Reset then open to allow key remount
    setTimeout(() => setFormModal({ open: true, room: null }), 0);
  }

  function openEdit(room) {
    setFormModal({ open: true, room });
  }

  function openDelete(room) {
    setDeleteModal({ open: true, room });
  }

  function handleFormSubmit(formData) {
    if (formModal.room) {
      updateMutation.mutate({ id: formModal.room._id ?? formModal.room.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleConfirmDelete() {
    if (!deleteModal.room) return;
    deleteMutation.mutate(deleteModal.room._id ?? deleteModal.room.id);
  }

  const isEditing = Boolean(formModal.room);
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const editInitial = formModal.room
    ? {
        name: formModal.room.name ?? '',
        type: formModal.room.type ?? 'SINGLE',
        description: formModal.room.description ?? '',
        price: formModal.room.pricePerNight ?? '',
        capacity: formModal.room.capacity ?? '',
        amenities: formModal.room.amenities ?? [],
        images: formModal.room.images ?? [],
      }
    : EMPTY_FORM;

  const hotelName = hotel?.name ?? 'Hotel Rooms';
  const isLoading = hotelLoading || roomsLoading;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Back button + hotel subtitle */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/owner/hotels')}
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors duration-150 mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to My Hotels
          </button>

          {hotelLoading ? (
            <div className="h-8 w-48 bg-surface-200 rounded-lg animate-pulse" />
          ) : (
            <p className="text-sm font-medium text-primary-600 tracking-wide uppercase">
              {hotelName}
            </p>
          )}
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-surface-900 tracking-tight">
              Rooms
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button variant="primary" leftIcon={Plus} onClick={openCreate}>
            Add Room
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-surface-400 font-medium">Loading rooms…</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <DoorOpen className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-base font-semibold text-surface-700">Failed to load rooms</p>
            <p className="text-sm text-surface-500">
              {error?.response?.data?.message ?? error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && rooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center">
              <BedDouble className="w-10 h-10 text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-surface-700">No rooms yet</p>
              <p className="text-sm text-surface-500 mt-1">
                Add your first room to start accepting bookings.
              </p>
            </div>
            <Button variant="primary" leftIcon={Plus} onClick={openCreate}>
              Add First Room
            </Button>
          </div>
        )}

        {/* Rooms table */}
        {!isLoading && !isError && rooms.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Price / Night
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {rooms.map((room) => {
                    const isAvailable = room.isAvailable ?? room.available ?? true;
                    const roomId = room._id ?? room.id;

                    return (
                      <tr
                        key={roomId}
                        className="hover:bg-surface-50/60 transition-colors duration-100"
                      >
                        {/* Room name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <BedDouble className="w-4.5 h-4.5 text-primary-500" />
                            </div>
                            <div>
                              <p className="font-medium text-surface-900">{room.name}</p>
                              {room.description && (
                                <p className="text-xs text-surface-400 mt-0.5 max-w-xs truncate">
                                  {room.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <Badge variant={ROOM_TYPE_COLORS[room.type] ?? 'default'}>
                            {room.type
                              ? room.type.charAt(0) + room.type.slice(1).toLowerCase()
                              : '—'}
                          </Badge>
                        </td>

                        {/* Capacity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-surface-600">
                            <Users className="w-3.5 h-3.5 text-surface-400" />
                            <span>{room.capacity ?? '—'}</span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-surface-700 font-medium">
                            <CircleDollarSign className="w-3.5 h-3.5 text-surface-400" />
                            <span>
                              {room.pricePerNight != null
                                ? `$${Number(room.pricePerNight).toLocaleString()}`
                                : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Availability */}
                        <td className="px-5 py-4">
                          <Badge variant={isAvailable ? 'success' : 'danger'} dot>
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={Pencil}
                              onClick={() => openEdit(room)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              leftIcon={Trash2}
                              onClick={() => openDelete(room)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Room Modal ── */}
      <Modal
        isOpen={formModal.open}
        onClose={() => !formSubmitting && setFormModal({ open: false, room: null })}
        title={isEditing ? 'Edit Room' : 'Add New Room'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setFormModal({ open: false, room: null })}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="room-form"
              variant="primary"
              loading={formSubmitting}
            >
              {isEditing ? 'Save Changes' : 'Create Room'}
            </Button>
          </div>
        }
      >
        <RoomForm
          key={formModal.room?._id ?? formModal.room?.id ?? 'create'}
          initial={editInitial}
          onSubmit={handleFormSubmit}
        />
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleteMutation.isPending && setDeleteModal({ open: false, room: null })}
        title="Delete Room"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, room: null })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Delete Room
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-surface-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-surface-900">
              {deleteModal.room?.name}
            </span>
            ? This cannot be undone.
          </p>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-medium text-red-700">
              Any existing bookings for this room may be affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
