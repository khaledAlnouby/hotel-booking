import React from 'react';

/* ─────────────────────────────────────────
   Variant map
───────────────────────────────────────── */
const variantClasses = {
  default: 'bg-surface-100 text-surface-600 border-surface-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'rounded-full border font-medium',
        'leading-none whitespace-nowrap',
        variantClasses[variant] ?? variantClasses.default,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={[
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            // Use current text colour for the dot
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'default' && 'bg-surface-400',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
