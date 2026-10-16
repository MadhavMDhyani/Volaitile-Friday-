import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className={`animate-fade-up ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
