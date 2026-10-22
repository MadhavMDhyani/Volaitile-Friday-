import { useId } from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ size = 'md', to = '/', showWordmark = true, className = '' }) => {
  const tileId = useId();
  const gradId = useId();
  const highlightId = useId();

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const wordmarkSizes = {
    sm: 'text-sm tracking-wide pt-[1px]',
    md: 'text-base tracking-wide pt-[2px]',
    lg: 'text-lg tracking-wide pt-[3px]',
  };

  const icon = (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size] || sizeClasses.md} shrink-0 transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      <defs>
        {/* Near-black glass squircle tile gradient (#0B0B0B to #1C1C1C) */}
        <linearGradient id={tileId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1C1C1C" />
          <stop offset="60%" stopColor="#111111" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </linearGradient>

        {/* Luminous orange-to-amber monogram gradient (#FF5722 to #CF4E24) */}
        <linearGradient id={gradId} x1="15%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#CF4E24" />
        </linearGradient>

        {/* Thin orange-tinted edge highlight for top-left edge */}
        <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 87, 34, 0.45)" />
          <stop offset="45%" stopColor="rgba(255, 255, 255, 0.20)" />
          <stop offset="100%" stopColor="rgba(255, 87, 34, 0)" />
        </linearGradient>
      </defs>

      {/* Near-black Squircle Glass Tile */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="16"
        fill={`url(#${tileId})`}
        stroke="rgba(255, 87, 34, 0.24)"
        strokeWidth="1.2"
      />

      {/* Top-Left Specular Yellow Sheen Arc */}
      <path
        d="M 19 4 L 44 4 C 52 4 58.5 9.5 59.5 17"
        fill="none"
        stroke={`url(#${highlightId})`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Monogram "VF" shared stem:
          - Left arm of V: (17, 21) -> (28, 48)
          - Shared stem continues upward: (28, 48) -> (44, 16)
          - Top bar of F branches right: (44, 16) -> (53, 16)
      */}
      <path
        d="M 17 21 L 28 48 L 44 16 L 53 16"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle bar of F branching right from stem at y=30 */}
      <path
        d="M 37 30 L 48 30"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Inner specular line highlight on the stroke in brand-pale */}
      <path
        d="M 18 22 L 27.5 45 L 43 17"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Small droplet highlight at V's vertex in brand-pale (#FFF3B0) */}
      <circle cx="28" cy="48" r="2.2" fill="#FFFFFF" />
      <circle cx="28" cy="47.6" r="1" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      {showWordmark && (
        <span
          className={`font-title font-normal tracking-wide text-[#fafafa] leading-none transition-colors duration-150 group-hover:text-white ${
            wordmarkSizes[size] || wordmarkSizes.md
          }`}
        >
          Volaitile Friday
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group inline-flex items-center focus-ring rounded-lg p-0.5"
        aria-label="Volaitile Friday Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
