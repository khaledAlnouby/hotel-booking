import { io } from 'socket.io-client';

/**
 * Socket.io client instance.
 *
 * Connects to the same origin as the page (the Vite dev proxy will forward
 * /socket.io traffic to the backend at localhost:5000).
 *
 * autoConnect is false so the application can connect/disconnect manually
 * (e.g., after the user authenticates).
 *
 * Usage:
 *   import socket from '@/lib/socket';
 *   socket.connect();
 *   socket.emit('join', roomId);
 *   socket.on('message', handler);
 *   socket.disconnect();
 */
const socket = io(window.location.origin, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;
