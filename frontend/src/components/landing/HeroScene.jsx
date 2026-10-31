/**
 * HeroScene:
 * Subtle non-blocking gradient framing that lets the global Three.js 3D background
 * and the fixed CSS green radial glow shine through cleanly.
 */
export const HeroScene = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[100svh] min-h-[640px] pointer-events-none overflow-hidden select-none -z-10"
    >
      {/* Subtle soft enhancement scrim for center readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 28%, rgba(7, 7, 7, 0.40) 0%, transparent 80%)',
        }}
      />
    </div>
  );
};

export default HeroScene;
