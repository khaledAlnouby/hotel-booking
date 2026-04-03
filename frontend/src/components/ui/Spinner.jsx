import React from 'react';

/* ─────────────────────────────────────────
   Size map (width / height in px → tw class)
───────────────────────────────────────── */
const sizeClasses = {
  sm: 'w-4 h-4 border-2',   // 16 px
  md: 'w-6 h-6 border-2',   // 24 px
  lg: 'w-10 h-10 border-4', // 40 px
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full',
        'border-surface-200',
        'border-t-primary-600',
        'animate-spin',
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export default Spinner;
