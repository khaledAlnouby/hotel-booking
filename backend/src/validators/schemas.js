import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'OWNER']).default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Hotel Schemas ───────────────────────────────────────────────────────────

export const createHotelSchema = z.object({
  name: z.string().min(2, 'Hotel name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  stars: z.number().int().min(1).max(5).default(3),
  amenities: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  images: z.array(z.string()).default([]),
});

export const updateHotelSchema = createHotelSchema.partial();

// ─── Room Schemas ────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.string().min(1, 'Room type is required'),
  pricePerNight: z.number().positive('Price must be positive'),
  capacity: z.number().int().positive().default(2),
  quantity: z.number().int().positive().default(1),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

export const updateRoomSchema = createRoomSchema.partial();

// ─── Booking Schemas ─────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  roomId: z.uuid('Invalid room ID'),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  guests: z.number().int().positive().default(1),
  specialRequests: z.string().max(500).optional(),
});

// ─── Review Schemas ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  hotelId: z.uuid('Invalid hotel ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
});

// ─── Search Schemas ──────────────────────────────────────────────────────────

export const searchHotelsSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  amenities: z.string().optional(), // comma-separated
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortBy: z.enum(['price', 'rating', 'stars', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
