import { useState, useEffect, useRef } from 'react';
import { LandscapeScene } from './landscape/LandscapeScene';
import './landscape/threeui.css';

/**
 * HeroScene component:
 * - Renders static CSS sunset poster
 * - Mounts <LandscapeScene variant="sunset" /> only when criteria are met (>=768px, no reduced motion, in view, etc.)
 * - Unmounts WebGL context when hero is out of view
 * - Provides non-invasive readability scrim and bottom section fade
 */
export const HeroScene = () => {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isSupportedViewport, setIsSupportedViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  const [allowsMotion, setAllowsMotion] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isVisible, setIsVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState !== 'hidden'
  );
  const [hasPainted, setHasPainted] = useState(false);

  // 1. Viewport & motion media query listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqlWidth = window.matchMedia('(min-width: 768px)');
    const handleWidthChange = (e) => setIsSupportedViewport(e.matches);
    mqlWidth.addEventListener('change', handleWidthChange);

    const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setAllowsMotion(!e.matches);
    mqlMotion.addEventListener('change', handleMotionChange);

    const handleVisibility = () => {
      setIsVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mqlWidth.removeEventListener('change', handleWidthChange);
      mqlMotion.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 2. IntersectionObserver: Mount when in view (rootMargin 200px), unmount when scrolled away
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Post-first-paint scheduling (requestIdleCallback with 300ms fallback)
  useEffect(() => {
    let idleId;
    let timeoutId;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => setHasPainted(true), { timeout: 300 });
    } else {
      timeoutId = setTimeout(() => setHasPainted(true), 300);
    }

    return () => {
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const isSaveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);

  const shouldMountScene =
    hasPainted &&
    isInView &&
    isSupportedViewport &&
    allowsMotion &&
    !isSaveData &&
    isVisible;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[100svh] min-h-[640px] pointer-events-auto overflow-hidden select-none"
    >
      {/* 1. Static CSS Sunset Poster (Always rendered behind the WebGL scene) */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 90% 45% at 50% 56%, rgba(240, 176, 136, 0.22) 0%, rgba(217, 138, 90, 0.16) 35%, transparent 70%),
            linear-gradient(to bottom, #140d09 0%, #1e130d 24%, #2a1a11 44%, #7a4a30 55%, #d98a5a 62%, #f0b088 67%, #2a1a11 76%, #140d09 100%)
          `,
        }}
      />

      {/* 2. WebGL Landscape Scene (Mounted only when criteria pass) */}
      {shouldMountScene && (
        <div className="shader-frame absolute inset-0 w-full h-full">
          <LandscapeScene variant="sunset" />
        </div>
      )}

      {/* 3. Static Overlays: Center Scrim for Headline & Subhead Readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 75% 50% at 50% 26%, rgba(var(--page-rgb) / 0.82) 0%, rgba(var(--page-rgb) / 0.45) 55%, transparent 100%)
          `,
        }}
      />

      {/* 4. Edge Vignette (Page Color Framing) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 96% 86% at 50% 45%, transparent 48%, rgba(var(--page-rgb) / 0.55) 78%, rgb(var(--page-rgb)) 100%)
          `,
        }}
      />

      {/* 5. Bottom Fade: Smooth transition into subsequent page sections over the last ~30% */}
      <div
        className="absolute inset-x-0 bottom-0 h-[36%] pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, rgba(var(--page-rgb) / 0.72) 65%, rgb(var(--page-rgb)) 100%)`,
        }}
      />
    </div>
  );
};

export default HeroScene;
