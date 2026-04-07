import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

/* ─────────────────────────────────────────
   Link columns
───────────────────────────────────────── */
const columns = [
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

const socials = [
  { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
  { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
];

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 text-surface-400">
      <div className="page-container py-14">
        {/* Top row: brand + columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 no-underline w-fit group"
            >
              <span className="text-2xl" aria-hidden="true">🏨</span>
              <span className="font-display font-bold text-xl text-white group-hover:text-primary-400 transition-colors duration-150">
                LuxStay
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-surface-400 max-w-[220px]">
              Find and book the perfect hotel for every journey. Premium stays, transparent prices.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={[
                    'flex items-center justify-center w-9 h-9 rounded-xl',
                    'text-surface-400 bg-surface-800',
                    'hover:text-white hover:bg-surface-700',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                {heading}
              </h3>
              <ul className="flex flex-col gap-3" role="list">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className={[
                        'text-sm text-surface-400 no-underline',
                        'hover:text-surface-200',
                        'transition-colors duration-150',
                      ].join(' ')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500 text-center sm:text-left">
            &copy; {currentYear} LuxStay, Inc. All rights reserved.
          </p>
          <p className="text-xs text-surface-600">
            Built with ♥ for travellers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
