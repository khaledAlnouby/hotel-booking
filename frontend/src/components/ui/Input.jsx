import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* ─────────────────────────────────────────
   Input component
───────────────────────────────────────── */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    type = 'text',
    id,
    className = '',
    disabled = false,
    required = false,
    ...rest
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  // Auto-generate id from label if not supplied
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const hasError = Boolean(error);
  const hasLeft = Boolean(LeftIcon);
  const hasRight = Boolean(RightIcon) || isPassword;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={[
            'block text-sm font-medium',
            hasError ? 'text-red-600' : 'text-surface-700',
          ].join(' ')}
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {/* Left icon */}
        {LeftIcon && (
          <span className="pointer-events-none absolute left-3.5 flex items-center">
            <LeftIcon
              className={[
                'h-4 w-4 flex-shrink-0',
                hasError ? 'text-red-400' : 'text-surface-400',
              ].join(' ')}
              aria-hidden="true"
            />
          </span>
        )}

        {/* Native input */}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          className={[
            // Base
            'w-full rounded-xl border bg-surface-100 py-2.5 text-sm text-surface-800',
            'placeholder:text-surface-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Padding left / right for icons
            hasLeft ? 'pl-10' : 'pl-4',
            hasRight ? 'pr-10' : 'pr-4',
            // State: normal
            !hasError &&
              !disabled &&
              'border-surface-200 focus:border-primary-400 focus:ring-primary-500/25 focus:bg-white',
            // State: error
            hasError &&
              'border-red-400 focus:border-red-400 focus:ring-red-300/30 bg-red-50/50',
            // State: disabled
            disabled && 'cursor-not-allowed opacity-60 border-surface-200',
            // Consumer overrides
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {/* Right side: password toggle OR custom rightIcon */}
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 flex items-center text-surface-400 hover:text-surface-600 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : RightIcon ? (
          <span className="pointer-events-none absolute right-3.5 flex items-center">
            <RightIcon
              className={[
                'h-4 w-4 flex-shrink-0',
                hasError ? 'text-red-400' : 'text-surface-400',
              ].join(' ')}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>

      {/* Error message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}

      {/* Hint text (only shown when no error) */}
      {!hasError && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-surface-500">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
