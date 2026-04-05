import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api, { setAccessToken } from '../lib/axios';

/* ─────────────────────────────────────────
   Context
───────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─────────────────────────────────────────
   Provider
───────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref in sync so callbacks don't capture stale state
  const accessTokenRef = useRef(null);

  // Every time the accessToken state changes, push it to the axios module
  useEffect(() => {
    accessTokenRef.current = accessToken;
    setAccessToken(accessToken);
  }, [accessToken]);

  /* ── Internal helpers ── */
  const applyTokens = useCallback((newAccessToken, newRefreshToken) => {
    setAccessTokenState(newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  }, []);

  const clearTokens = useCallback(() => {
    setAccessTokenState(null);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
  }, []);

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get('/auth/profile');
    const profile = data.data;
    setUser(profile);
    return profile;
  }, []);

  /* ── Session restore on mount ── */
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!storedRefreshToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.post('/auth/refresh', {
          refreshToken: storedRefreshToken,
        });

        if (cancelled) return;

        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
        applyTokens(newAccess, newRefresh);

        // Temporarily push the token so fetchProfile request is authorised
        setAccessToken(newAccess);
        await fetchProfile();
      } catch {
        if (!cancelled) {
          clearTokens();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Public API ── */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken: newAccess, refreshToken: newRefresh, user: userData } = data.data;

    applyTokens(newAccess, newRefresh);
    // Ensure axios module is updated before any subsequent requests
    setAccessToken(newAccess);

    const profile = userData ?? (await fetchProfile());
    setUser(profile);
    return profile;
  }, [applyTokens, fetchProfile]);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const { accessToken: newAccess, refreshToken: newRefresh, user: userData } = data.data;

    applyTokens(newAccess, newRefresh);
    setAccessToken(newAccess);

    const profile = userData ?? (await fetchProfile());
    setUser(profile);
    return profile;
  }, [applyTokens, fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — we clear locally regardless
    } finally {
      clearTokens();
    }
  }, [clearTokens]);

  const updateUser = useCallback((data) => {
    setUser((prev) => ({ ...prev, ...data }));
  }, []);

  /* ── Memoised context value ── */
  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, accessToken, loading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─────────────────────────────────────────
   Hook
───────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
