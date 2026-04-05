import axios from 'axios';

/* ─────────────────────────────────────────
   Module-level token store
   (Avoids circular dep with AuthContext)
───────────────────────────────────────── */
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

/* ─────────────────────────────────────────
   Axios instance
───────────────────────────────────────── */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─────────────────────────────────────────
   Request interceptor — attach Bearer token
───────────────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = _accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ─────────────────────────────────────────
   Refresh-queue helpers
───────────────────────────────────────── */
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

function clearSession() {
  _accessToken = null;
  localStorage.removeItem('refreshToken');
  // Hard redirect so AuthContext also resets via its own mount logic
  window.location.href = '/login';
}

/* ─────────────────────────────────────────
   Response interceptor — handle 401 / refresh
───────────────────────────────────────── */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that haven't been retried yet.
    // Skip the refresh endpoint itself to prevent infinite loops.
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/login'
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh resolves
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!storedRefreshToken) {
      isRefreshing = false;
      processQueue(error, null);
      clearSession();
      return Promise.reject(error);
    }

    try {
      // Use a plain axios call (not `api`) to avoid the interceptor loop
      const { data } = await axios.post('/api/auth/refresh', {
        refreshToken: storedRefreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;

      setAccessToken(newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Update the failed request's header
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
