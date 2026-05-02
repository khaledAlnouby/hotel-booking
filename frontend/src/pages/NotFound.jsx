import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MoveLeft } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div
      className={[
        'min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center',
        'px-4 py-24 text-center',
        'bg-gradient-to-b from-surface-50 to-surface-100',
        'animate-fade-in',
      ].join(' ')}
    >
      {/* Large 404 gradient text */}
      <p
        className={[
          'font-display font-bold select-none leading-none',
          'text-[clamp(6rem,20vw,12rem)]',
          'bg-gradient-to-br from-primary-400 via-primary-600 to-primary-900',
          'bg-clip-text text-transparent',
        ].join(' ')}
        aria-hidden="true"
      >
        404
      </p>

      {/* Heading */}
      <h1 className="mt-2 font-display font-bold text-2xl sm:text-3xl text-surface-900">
        Page not found
      </h1>

      {/* Description */}
      <p className="mt-3 max-w-md text-base text-surface-500 leading-relaxed">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved, deleted, or never existed in the first place.
      </p>

      {/* Actions */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="lg" leftIcon={Home}>
            Go home
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className={[
            'inline-flex items-center gap-2',
            'text-sm font-medium text-surface-500',
            'hover:text-surface-800 transition-colors duration-150',
            'focus:outline-none focus-visible:underline',
          ].join(' ')}
        >
          <MoveLeft className="w-4 h-4" aria-hidden="true" />
          Go back
        </button>
      </div>

      {/* Decorative illustration */}
      <div
        className="mt-16 text-[5rem] opacity-20 select-none"
        aria-hidden="true"
      >
        🏨
      </div>
    </div>
  );
}
