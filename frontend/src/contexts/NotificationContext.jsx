import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import api from '../lib/axios';
import socket from '../lib/socket';
import { useAuth } from './AuthContext';

/* ─────────────────────────────────────────
   Context
───────────────────────────────────────── */
const NotificationContext = createContext(null);

/* ─────────────────────────────────────────
   Provider
   - Manages the global socket connection (connect when authed, disconnect on logout)
   - Fetches and manages in-app notifications
   - Exposes socket + online-users state to the rest of the app
───────────────────────────────────────── */
export function NotificationProvider({ children }) {
  const { user, accessToken } = useAuth();

  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]     = useState(0);
  const [onlineUsers,    setOnlineUsers]     = useState([]);
  const [socketReady,    setSocketReady]     = useState(false);

  // Avoid stale closures inside socket handlers
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  /* ── Fetch notifications from REST ── */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      const list = data.data ?? [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // silently ignore — user may not be authed yet
    }
  }, [user]);

  /* ── Socket lifecycle — connect when authenticated ── */
  useEffect(() => {
    if (!accessToken || !user) {
      if (socket.connected) socket.disconnect();
      setSocketReady(false);
      setOnlineUsers([]);
      return;
    }

    socket.auth = { token: accessToken };
    socket.connect();

    function onConnect() {
      socket.emit('user:online', user.id);
      setSocketReady(true);
    }

    function onDisconnect() {
      setSocketReady(false);
    }

    function onUsersOnline(userIds) {
      setOnlineUsers(userIds);
    }

    function onNotification(notification) {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    }

    socket.on('connect',           onConnect);
    socket.on('disconnect',        onDisconnect);
    socket.on('users:online',      onUsersOnline);
    socket.on('notification:new',  onNotification);

    // If socket is already connected (e.g. HMR), register immediately
    if (socket.connected) {
      socket.emit('user:online', user.id);
      setSocketReady(true);
    }

    return () => {
      socket.off('connect',          onConnect);
      socket.off('disconnect',       onDisconnect);
      socket.off('users:online',     onUsersOnline);
      socket.off('notification:new', onNotification);
      socket.disconnect();
    };
  }, [accessToken, user]);

  /* ── Load notifications when user logs in ── */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ── Mark one as read ── */
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  /* ── Mark all as read ── */
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        onlineUsers,
        socketReady,
        socket,
        markAsRead,
        markAllAsRead,
        refetchNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/* ─────────────────────────────────────────
   Hook
───────────────────────────────────────── */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
