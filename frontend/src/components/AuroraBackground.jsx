export const AuroraBackground = () => {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#05060a]"
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

      {/* Aurora Orb 1: Cyan luminous field */}
      <div
        className="absolute -top-[12%] -left-[8%] w-[680px] h-[680px] md:w-[920px] md:h-[920px] rounded-full aurora-orb-1 opacity-70 blur-[90px] md:blur-[130px]"
        style={{
          background: 'radial-gradient(circle at 45% 45%, rgba(0, 240, 255, 0.22) 0%, rgba(6, 182, 212, 0.09) 45%, transparent 70%)',
        }}
      />

      {/* Aurora Orb 2: Violet luminous field */}
      <div
        className="absolute top-[30%] -right-[10%] w-[640px] h-[640px] md:w-[860px] md:h-[860px] rounded-full aurora-orb-2 opacity-65 blur-[90px] md:blur-[130px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.22) 0%, rgba(124, 58, 237, 0.09) 45%, transparent 70%)',
        }}
      />

      {/* Aurora Orb 3: Rose & Amber accent field */}
      <div
        className="absolute -bottom-[12%] left-[20%] w-[480px] h-[480px] md:w-[680px] md:h-[680px] rounded-full aurora-orb-3 opacity-55 blur-[80px] md:blur-[115px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.16) 0%, rgba(251, 191, 36, 0.08) 40%, transparent 68%)',
        }}
      />

      {/* Subtle Noise Texture Overlay (~3% opacity) to eliminate color banding */}
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
