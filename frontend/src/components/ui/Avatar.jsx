import React, { useState } from 'react';

/* ─────────────────────────────────────────
   Size map
───────────────────────────────────────── */
const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

/* ─────────────────────────────────────────
   Helper: extract initials from a name string
───────────────────────────────────────── */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  alt,
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full flex-shrink-0',
        'overflow-hidden select-none',
        sizeClasses[size] ?? sizeClasses.md,
        !showImage ? 'bg-primary-100' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? 'User avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-semibold text-primary-700 leading-none"
        >
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

export default Avatar;
