import React from 'react';

/**
 * HeroScene component:
 * - Renders static CSS background with Haiti -> faint violet glow
 * - Provides non-invasive readability scrim and bottom section fade
 */
export const HeroScene = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[100svh] min-h-[640px] pointer-events-none overflow-hidden select-none"
    >
      {/* 1. Static CSS Gradient Poster: Haiti -> Faint Violet Glow */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 90% 50% at 50% 52%, rgba(169, 139, 255, 0.18) 0%, rgba(131, 77, 251, 0.10) 38%, transparent 70%),
            linear-gradient(to bottom, #18102B 0%, #211737 28%, #2C2048 48%, #3E2380 58%, rgba(131, 77, 251, 0.30) 64%, rgba(169, 139, 255, 0.15) 70%, #211737 82%, #18102B 100%)
          `,
        }}
      />

      {/* 2. Static Overlays: Center Scrim for Headline & Subhead Readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 75% 50% at 50% 26%, rgba(var(--page-rgb) / 0.82) 0%, rgba(var(--page-rgb) / 0.45) 55%, transparent 100%)
          `,
        }}
      />

      {/* 3. Edge Vignette (Page Color Framing) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 96% 86% at 50% 45%, transparent 48%, rgba(var(--page-rgb) / 0.55) 78%, rgb(var(--page-rgb)) 100%)
          `,
        }}
      />

      {/* 4. Bottom Fade: Smooth transition into subsequent page sections over the last ~30% */}
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
