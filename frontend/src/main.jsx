import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import queryClient from './lib/queryClient';
import './index.css';

/* ─────────────────────────────────────────
   React Query Devtools — dev only, lazy
───────────────────────────────────────── */
const ReactQueryDevtools =
  import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/react-query-devtools')
          .then((m) => ({ default: m.ReactQueryDevtools }))
          // Silently swallow if devtools package is not installed
          .catch(() => ({ default: () => null })),
      )
    : null;

/* ─────────────────────────────────────────
   Toast configuration
───────────────────────────────────────── */
const toastOptions = {
  position: 'top-right',
  duration: 4000,
  style: {
    background: '#1e293b',   // surface-800
    color: '#f8fafc',        // surface-50
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid #334155', // surface-700
  },
  success: {
    iconTheme: {
      primary: '#4c6ef5',   // primary-600
      secondary: '#f8fafc',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f8fafc',
    },
  },
};

/* ─────────────────────────────────────────
   Root render
───────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
            <Toaster
              position={toastOptions.position}
              toastOptions={toastOptions}
            />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>

      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
