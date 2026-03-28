import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Config
dotenv.config();

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import hotelRoutes from './src/routes/hotelRoutes.js';
import roomRoutes from './src/routes/roomRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import favoriteRoutes from './src/routes/favoriteRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import paymentController from './src/controllers/paymentController.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { initSocket } from './src/config/socketManager.js';

// Middleware imports
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ─── Global Middleware ───────────────────────────────────────────────────────

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));

// Stripe webhook needs the raw body — register BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api', roomRoutes);          // /api/hotels/:hotelId/rooms AND /api/rooms/:id
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes); // /api/reviews AND /api/hotels/:hotelId/reviews
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hotel Booking API is running', timestamp: new Date().toISOString() });
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────

// Make io available to controllers via the socketManager singleton
initSocket(io);

// Track online users: userId -> Set of socketIds (supports multiple tabs)
const onlineUserSockets = new Map();

function addOnline(userId, socketId) {
  if (!onlineUserSockets.has(userId)) onlineUserSockets.set(userId, new Set());
  onlineUserSockets.get(userId).add(socketId);
}

function removeOnline(userId, socketId) {
  const sockets = onlineUserSockets.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUserSockets.delete(userId);
}

function broadcastOnlineUsers() {
  io.emit('users:online', Array.from(onlineUserSockets.keys()));
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Client calls this right after connecting to register their userId.
  // Also joins a named room so server can target them directly.
  socket.on('user:online', (userId) => {
    socket.userId = userId;
    socket.join(`user:${userId}`);
    addOnline(userId, socket.id);
    broadcastOnlineUsers();
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      removeOnline(socket.userId, socket.id);
      broadcastOnlineUsers();
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         🏨  Hotel Booking Platform API                   ║
║         Running on port ${PORT}                            ║
║         Environment: ${process.env.NODE_ENV || 'development'}                  ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export { io };
