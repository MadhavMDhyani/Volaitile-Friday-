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
    // Primary: solid green fill with dark text (WCAG AA) + mint glow on hover
    primary:
      'bg-primary text-[#070707] border border-primary/40 hover:bg-[#2da858] shadow-[0_4px_16px_rgba(51,188,101,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_6px_24px_rgba(51,188,101,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] rounded-full',
    // Secondary: glass style, border turns --accent on hover
    secondary:
      'bg-white/[0.05] text-white border border-white/[0.18] hover:bg-white/[0.09] hover:border-[#12DCEF]/60 shadow-[0_1px_0_rgba(0,0,0,0.4)] rounded-full',
    // Danger: accent-tint tinted glass with accent text
    danger:
      'bg-[rgba(18,220,239,0.08)] text-[#12DCEF] border border-[rgba(18,220,239,0.25)] hover:bg-[rgba(18,220,239,0.14)] hover:border-[rgba(18,220,239,0.45)] shadow-[0_1px_0_rgba(0,0,0,0.4)] rounded-full',
    // Ghost: transparent, subtle hover
    ghost:
      'bg-transparent text-[rgba(255,255,255,0.55)] border border-transparent hover:bg-white/[0.06] hover:text-white hover:border-white/[0.12] rounded-full',
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


