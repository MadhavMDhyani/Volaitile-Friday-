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
    'relative inline-flex items-center justify-center font-medium select-none rounded-full transition-all duration-150 ease-out focus-ring active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variantClasses = {
    // Primary: solid --primary with dark text (#070707) and faint mint glow on hover
    primary:
      'bg-primary text-[#070707] border border-primary/50 shadow-[0_2px_12px_rgba(51,188,101,0.25)] hover:shadow-[0_0_22px_rgba(93,255,217,0.45)] hover:border-glow/60',
    // Secondary: glass style, border turns --accent on hover
    secondary:
      'bg-glass-bg text-white border border-glass-border backdrop-blur-md hover:border-accent hover:text-white shadow-[0_1px_0_rgba(0,0,0,0.4)]',
    // Danger: glass style with accent/alert
    danger:
      'bg-glass-bg text-red-400 border border-red-500/30 backdrop-blur-md hover:border-red-400 hover:text-red-300 shadow-[0_1px_0_rgba(0,0,0,0.4)]',
    // Ghost: transparent, subtle glass hover
    ghost:
      'bg-transparent text-text-muted border border-transparent hover:bg-glass-bg hover:text-white hover:border-glass-border',
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


