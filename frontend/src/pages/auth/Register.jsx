import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';

/* ─────────────────────────────────────────
   Validation
───────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  const errors = {};

  if (!fields.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!fields.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }

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

  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

/* ─────────────────────────────────────────
   Role selector card
───────────────────────────────────────── */
function RoleCard({ value, selected, onSelect, title, description, icon: Icon }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={[
        'flex items-start gap-3 w-full rounded-xl border-2 p-4 text-left',
        'transition-all duration-150 focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-glass-sm'
          : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/30',
      ].join(' ')}
    >
      {/* Icon */}
      <div
        className={[
          'mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
          selected
            ? 'bg-primary-600 text-white'
            : 'bg-surface-100 text-surface-500',
          'transition-colors duration-150',
        ].join(' ')}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-semibold leading-snug',
            selected ? 'text-primary-700' : 'text-surface-800',
          ].join(' ')}
        >
          {title}
        </p>
        <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Radio indicator */}
      <div
        className={[
          'mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
          selected
            ? 'border-primary-600 bg-primary-600'
            : 'border-surface-300 bg-white',
          'transition-all duration-150',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && (
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState('CUSTOMER');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ── Field change ── */
  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
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
      await register({
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim(),
        password: fields.password,
        role,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Registration failed. Please try again.';
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Join LuxStay — it&apos;s free and takes 30 seconds
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              leftIcon={User}
              value={fields.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              disabled={submitting}
            />
            <Input
              label="Last name"
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Doe"
              value={fields.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              disabled={submitting}
            />
          </div>

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

          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            leftIcon={Lock}
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            hint="Use at least 6 characters."
            required
            disabled={submitting}
          />

          <Input
            label="Confirm password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            leftIcon={Lock}
            value={fields.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            disabled={submitting}
          />

          {/* Role selector */}
          <div className="flex flex-col gap-2">
            <p className="block text-sm font-medium text-surface-700">
              I am joining as
            </p>
            <div
              role="radiogroup"
              aria-label="Account type"
              className="flex flex-col gap-2"
            >
              <RoleCard
                value="CUSTOMER"
                selected={role === 'CUSTOMER'}
                onSelect={setRole}
                icon={User}
                title="I'm a Guest"
                description="Browse hotels, make bookings, and manage your stays."
              />
              <RoleCard
                value="OWNER"
                selected={role === 'OWNER'}
                onSelect={setRole}
                icon={UserCheck}
                title="I'm a Hotel Owner"
                description="List your properties and manage reservations."
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            className="mt-2"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-surface-200" />
          <span className="text-xs text-surface-400 font-medium">or</span>
          <div className="flex-1 h-px bg-surface-200" />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-surface-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-800 hover:underline transition-colors duration-150"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
