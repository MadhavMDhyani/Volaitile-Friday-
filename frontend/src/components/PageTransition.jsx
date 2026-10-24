import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();
  const supportsViewTransitions =
    typeof document !== 'undefined' && typeof document.startViewTransition === 'function';

  // Never run both at once: if native View Transitions are supported, skip the CSS fallback
  if (supportsViewTransitions) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div key={location.pathname} className={`animate-fade-up ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
