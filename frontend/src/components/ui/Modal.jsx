import React, { useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

/* ─────────────────────────────────────────
   Size map
───────────────────────────────────────── */
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/* ─────────────────────────────────────────
   Modal component
───────────────────────────────────────── */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  /* ── Close on Escape ── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleKeyDown]);

  /* ── Close on overlay click (but not panel click) ── */
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={handleOverlayClick}
      className={[
        'fixed inset-0 z-50',
        'flex items-center justify-center p-4',
        'bg-surface-900/60 backdrop-blur-sm',
        'animate-fade-in',
      ].join(' ')}
    >
      <div
        ref={panelRef}
        className={[
          'relative w-full bg-white rounded-2xl shadow-2xl',
          'flex flex-col max-h-[90vh]',
          'animate-scale-in',
          sizeClasses[size] ?? sizeClasses.md,
        ].join(' ')}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-100 flex-shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold font-display text-surface-900 leading-snug"
              >
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={[
                'rounded-lg p-1.5 text-surface-400',
                'hover:bg-surface-100 hover:text-surface-600',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-400',
                title ? 'ml-auto' : '',
              ].join(' ')}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-5 pt-4 border-t border-surface-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
