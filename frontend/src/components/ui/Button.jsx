import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────
   Variant & size maps
───────────────────────────────────────── */
const variantClasses = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 disabled:bg-primary-300',
  secondary:
    'bg-surface-100 text-surface-700 shadow-sm hover:bg-surface-200 active:bg-surface-300 focus-visible:ring-surface-400 disabled:bg-surface-50 disabled:text-surface-400',
  danger:
    'bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-400 disabled:bg-red-300',
  ghost:
    'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-400 disabled:text-primary-300',
  outline:
    'bg-transparent border border-primary-300 text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-400 disabled:border-primary-200 disabled:text-primary-300',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

const iconSizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const spinnerSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        // Base
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'select-none whitespace-nowrap',
        // Disabled base
        'disabled:cursor-not-allowed disabled:opacity-70',
        // Variant
        variantClasses[variant] ?? variantClasses.primary,
        // Size
        sizeClasses[size] ?? sizeClasses.md,
        // Full width
        fullWidth ? 'w-full' : '',
        // Consumer overrides
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2
          className={`animate-spin ${spinnerSizeClasses[size]}`}
          aria-hidden="true"
        />
      ) : LeftIcon ? (
        <LeftIcon className={iconSizeClasses[size]} aria-hidden="true" />
      ) : null}

      {children && (
        <span className={loading ? 'opacity-70' : ''}>{children}</span>
      )}

      {!loading && RightIcon && (
        <RightIcon className={iconSizeClasses[size]} aria-hidden="true" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
