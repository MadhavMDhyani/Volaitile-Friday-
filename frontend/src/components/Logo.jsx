import { Link } from 'react-router-dom';

export const Logo = ({ size = 'md', to = '/', showWordmark = true, className = '', onClick }) => {
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
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size] || sizeClasses.md} shrink-0 transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      {/* Minimal simple mark in #33BC65 */}
      <path
        d="M5 8 L16 26 L27 8"
        stroke="#33BC65"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8 L16 18 L22 8"
        stroke="#33BC65"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      {showWordmark && (
        <span
          className={`font-sans font-medium tracking-tight text-white leading-none transition-colors duration-150 group-hover:text-white ${
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
        onClick={onClick}
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
