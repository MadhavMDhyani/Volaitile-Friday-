
/**
 * HeroScene component:
 * - Renders static CSS background with near-black → soft green radial glow
 * - Provides non-invasive readability scrim and bottom section fade
 */
export const HeroScene = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[100svh] min-h-[640px] pointer-events-none overflow-hidden select-none"
    >
      {/* 1. Static CSS Gradient Poster: near-black → green radial glow top-right */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 88% 5%, rgba(51, 188, 101, 0.24) 0%, rgba(93, 255, 217, 0.10) 38%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 50% 52%, rgba(18, 220, 239, 0.08) 0%, transparent 65%),
            #070707
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
