/**
 * Singleton wrapper so any module (e.g. controllers) can get the Socket.IO
 * server instance without creating a circular import with server.js.
 *
 * Usage:
 *   // In server.js — call once after creating `io`:
 *   import { initSocket } from './src/config/socketManager.js';
 *   initSocket(io);
 *
 *   // Anywhere else:
 *   import { getIO } from '../config/socketManager.js';
 *   getIO().to(socketId).emit('event', data);
 */

let _io = null;

export function initSocket(io) {
  _io = io;
}

export function getIO() {
  return _io;
}
