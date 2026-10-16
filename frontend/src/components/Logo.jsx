import { Link } from 'react-router-dom';

export const Logo = ({ size = 'md', to = '/', showWordmark = true, className = '' }) => {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const wordmarkSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex ${sizeClasses[size] || sizeClasses.md} items-center justify-center rounded-md border border-[#262626] bg-[#171717] font-mono font-bold tracking-tight text-[#fafafa] transition-colors duration-150 group-hover:border-[#404040] group-hover:bg-[#262626]`}
      >
        VF
      </div>
      {showWordmark && (
        <span
          className={`font-mono font-semibold tracking-tight text-[#fafafa] ${wordmarkSizes[size] || wordmarkSizes.md}`}
        >
          Volaitile Friday
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex items-center focus-ring rounded-md" aria-label="Volaitile Friday Home">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
