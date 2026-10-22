import { useEffect, useState } from 'react';

export const AuroraBackground = () => {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const playStyle = isPaused ? { animationPlayState: 'paused' } : undefined;

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-page"
      aria-hidden="true"
    >
      {/* Hidden SVG defining progressive enhancement liquid refraction filter */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-filter" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.015"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>
        </defs>
      </svg>

      {/* Aurora Orb 1: Warm copper luminous field */}
      <div
        className="absolute -top-[12%] -left-[8%] w-[760px] h-[760px] md:w-[1050px] md:h-[1050px] rounded-full aurora-orb-1 opacity-80 blur-[90px] md:blur-[130px]"
        style={{
          background: 'radial-gradient(circle at 45% 45%, rgba(217,138,90,0.18) 0%, rgba(196,122,74,0.08) 45%, transparent 70%)',
          ...playStyle,
        }}
      />

      {/* Aurora Orb 2: Deep brown luminous field */}
      <div
        className="absolute top-[30%] -right-[10%] w-[720px] h-[720px] md:w-[980px] md:h-[980px] rounded-full aurora-orb-2 opacity-75 blur-[90px] md:blur-[130px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(168,104,64,0.18) 0%, rgba(122,74,48,0.10) 45%, transparent 70%)',
          ...playStyle,
        }}
      />

      {/* Aurora Orb 3: Amber accent field */}
      <div
        className="absolute -bottom-[12%] left-[20%] w-[540px] h-[540px] md:w-[760px] md:h-[760px] rounded-full aurora-orb-3 opacity-65 blur-[80px] md:blur-[115px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(122,74,48,0.22) 0%, rgba(58,37,24,0.12) 40%, transparent 68%)',
          ...playStyle,
        }}
      />

      {/* Subtle Noise Texture Overlay (~3.5% opacity) to eliminate color banding */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
