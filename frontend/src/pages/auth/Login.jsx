import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';

/* ─────────────────────────────────────────
   Validation helpers
───────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  const errors = {};

  if (!fields.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname ?? '/';

  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ── Field change ── */
  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field on first keystroke
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(fields.email.trim(), fields.password);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render ── */
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-primary-50 via-surface-50 to-surface-100">
      {/* Card */}
      <div
        className={[
          'w-full max-w-md',
          'bg-white/80 backdrop-blur-md',
          'rounded-2xl shadow-glass border border-white/60',
          'px-8 py-10',
          'animate-slide-up',
        ].join(' ')}
      >
        {/* Logo / brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={[
              'w-14 h-14 rounded-2xl mb-4',
              'bg-gradient-to-br from-primary-500 to-primary-700',
              'flex items-center justify-center shadow-glow',
            ].join(' ')}
            aria-hidden="true"
          >
            <span className="text-2xl">🏨</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-surface-900 tracking-tight">
            Welcome to LuxStay
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={Mail}
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={submitting}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={Lock}
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
              required
              disabled={submitting}
            />
            {/* Forgot password */}
            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs text-primary-600 hover:text-primary-800 hover:underline transition-colors duration-150 focus:outline-none focus-visible:underline"
                tabIndex={0}
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            leftIcon={submitting ? undefined : LogIn}
            className="mt-1"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-surface-200" />
          <span className="text-xs text-surface-400 font-medium">or</span>
          <div className="flex-1 h-px bg-surface-200" />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-surface-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-800 hover:underline transition-colors duration-150"
          >
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  );
}
