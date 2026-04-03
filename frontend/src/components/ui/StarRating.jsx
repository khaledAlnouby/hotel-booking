import React, { useState } from 'react';
import { Star } from 'lucide-react';

/* ─────────────────────────────────────────
   Size map
───────────────────────────────────────── */
const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

const gapClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

/* ─────────────────────────────────────────
   Single star renderer (filled / half / empty)
───────────────────────────────────────── */
function StarIcon({ fill, size, className = '' }) {
  const cls = sizeClasses[size] ?? sizeClasses.md;

  if (fill === 'full') {
    return (
      <Star
        className={`${cls} fill-accent-400 text-accent-400 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (fill === 'half') {
    // Render a half-filled star using a clip mask trick with two overlapping stars
    return (
      <span className={`relative inline-flex ${cls} ${className}`} aria-hidden="true">
        {/* Empty base */}
        <Star className={`${cls} text-surface-300`} />
        {/* Filled half clipped */}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: '50%' }}
        >
          <Star className={`${cls} fill-accent-400 text-accent-400`} />
        </span>
      </span>
    );
  }

  // empty
  return (
    <Star
      className={`${cls} text-surface-300 ${className}`}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
function StarRating({
  value = 0,
  onChange,
  size = 'md',
  max = 5,
  className = '',
  readOnly = false,
}) {
  const interactive = Boolean(onChange) && !readOnly;
  const [hovered, setHovered] = useState(null);

  const displayValue = interactive && hovered !== null ? hovered : value;

  function getFill(starIndex) {
    const diff = displayValue - starIndex; // starIndex is 1-based
    if (diff >= 1) return 'full';
    if (diff >= 0.5) return 'half';
    return 'empty';
  }

  return (
    <span
      role={interactive ? 'group' : undefined}
      aria-label={
        interactive
          ? `Star rating: ${value} of ${max}`
          : `${value} out of ${max} stars`
      }
      className={[
        'inline-flex items-center',
        gapClasses[size] ?? gapClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Array.from({ length: max }, (_, i) => {
        const starNumber = i + 1; // 1-indexed

        if (interactive) {
          return (
            <button
              key={starNumber}
              type="button"
              aria-label={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
              onClick={() => onChange(starNumber)}
              onMouseEnter={() => setHovered(starNumber)}
              onMouseLeave={() => setHovered(null)}
              className={[
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm',
                'transition-transform duration-100',
                hovered !== null && hovered >= starNumber
                  ? 'scale-110'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <StarIcon fill={getFill(starNumber)} size={size} />
            </button>
          );
        }

        return (
          <StarIcon
            key={starNumber}
            fill={getFill(starNumber)}
            size={size}
          />
        );
      })}
    </span>
  );
}

export default StarRating;
