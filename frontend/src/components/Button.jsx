export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium select-none rounded-lg transition-all duration-150 ease-out focus-ring active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variantClasses = {
    // Primary: accent fill with dark text for contrast (WCAG AA ~6:1)
    primary:
      'bg-accent text-[#140d09] border border-accent/40 hover:bg-accent-hover shadow-[0_4px_16px_rgba(217,138,90,0.25),inset_0_1px_0_rgba(255,200,150,0.25)] hover:shadow-[0_6px_20px_rgba(217,138,90,0.40),inset_0_1px_0_rgba(255,200,150,0.35)]',
    // Secondary becomes glass with subtle specular line
    secondary:
      'bg-white/[0.04] text-[#f3e6da] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,200,150,0.15),0_4px_12px_rgba(0,0,0,0.35)]',
    // Danger becomes tinted accent glass (copper-on-dark, accessible)
    danger:
      'bg-accent-tint/40 text-accent border border-accent-deep hover:bg-accent-tint/60 hover:border-accent-press backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(217,138,90,0.2),0_4px_16px_rgba(217,138,90,0.10)]',
    // Ghost becomes transparent glass hover
    ghost:
      'bg-transparent text-[#a89384] border border-transparent hover:bg-white/[0.06] hover:text-[#f3e6da] hover:border-white/8 backdrop-blur-[8px]',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'p-2 text-base justify-center',
    'icon-sm': 'p-1.5 text-sm justify-center',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex items-center">{icon}</span>}
          {children}
          {iconRight && <span className="inline-flex items-center">{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
