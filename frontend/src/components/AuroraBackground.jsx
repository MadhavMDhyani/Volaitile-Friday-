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
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ background: '#070707' }}
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

      {/* Orb 1: Primary green glow — top-right anchor */}
      <div
        className="absolute -top-[10%] -right-[6%] w-[680px] h-[680px] md:w-[960px] md:h-[960px] rounded-full aurora-orb-1 opacity-70 blur-[100px] md:blur-[140px]"
        style={{
          background: 'radial-gradient(circle at 55% 45%, rgba(51,188,101,0.22) 0%, rgba(93,255,217,0.10) 45%, transparent 70%)',
          ...playStyle,
        }}
      />

      {/* Orb 2: Accent mint — mid-right */}
      <div
        className="absolute top-[35%] -right-[8%] w-[600px] h-[600px] md:w-[820px] md:h-[820px] rounded-full aurora-orb-2 opacity-55 blur-[90px] md:blur-[120px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(18,220,239,0.14) 0%, rgba(51,188,101,0.07) 45%, transparent 70%)',
          ...playStyle,
        }}
      />

      {/* Orb 3: Subtle glow — bottom-right fade */}
      <div
        className="absolute -bottom-[8%] right-[15%] w-[480px] h-[480px] md:w-[660px] md:h-[660px] rounded-full aurora-orb-3 opacity-45 blur-[80px] md:blur-[110px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(93,255,217,0.12) 0%, rgba(18,220,239,0.06) 40%, transparent 68%)',
          ...playStyle,
        }}
      />

      {/* Noise texture overlay to eliminate colour banding */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"),
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
