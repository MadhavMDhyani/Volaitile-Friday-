import { useEffect, useRef, useState } from 'react';

// Single shared IntersectionObserver instance for all scroll reveals
let sharedObserver = null;
const observerCallbacks = new Map();

function getSharedObserver() {
  if (typeof window === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cb = observerCallbacks.get(entry.target);
            if (cb) {
              cb();
              observerCallbacks.delete(entry.target);
              sharedObserver.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
    );
  }
  return sharedObserver;
}

export const Reveal = ({
  children,
  delay = 0,
  className = '',
  as: Component = 'div',
  transformOnly = false, // When true, animates only transform (critical for backdrop-filter containers)
  ...rest
}) => {
  const domRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      setIsDone(true);
      return;
    }

    const el = domRef.current;
    if (!el) return;

    const observer = getSharedObserver();
    if (!observer) {
      setIsVisible(true);
      setIsDone(true);
      return;
    }

    observerCallbacks.set(el, () => {
      setIsVisible(true);
    });
    observer.observe(el);

    return () => {
      observerCallbacks.delete(el);
      observer?.unobserve(el);
    };
  }, []);

  const handleTransitionEnd = (e) => {
    if (e.target === domRef.current) {
      setIsDone(true);
    }
  };

  const willChangeStyle = isVisible && !isDone ? { willChange: 'transform' } : undefined;

  return (
    <Component
      ref={domRef}
      onTransitionEnd={handleTransitionEnd}
      style={{
        transitionDuration: '550ms',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        ...willChangeStyle,
      }}
      className={`transition-all ${
        transformOnly
          ? isVisible
            ? 'translate-y-0'
            : 'translate-y-6'
          : isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      } ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Reveal;
