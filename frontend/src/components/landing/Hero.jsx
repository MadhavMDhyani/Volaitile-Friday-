import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductMockup from './ProductMockup';
import Reveal from './Reveal';

export const Hero = () => {
  const mockupWrapperRef = useRef(null);

  useEffect(() => {
    // Parallax rule: single passive scroll listener throttled with rAF, writes CSS variable on DOM element, disabled on <768px
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    let ticking = false;
    const el = mockupWrapperRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Apply subtle parallax translation (max 40px)
          const offset = Math.min(scrollY * 0.08, 40);
          el.style.transform = `translate3d(0, -${offset}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const techStack = [
    'React 19',
    'Node.js (ESM)',
    'MongoDB 7',
    'Redis 7',
    'Socket.IO',
    'Google Gemini AI',
  ];

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Pill Tag */}
        <Reveal delay={0}>
          <div className="inline-flex items-center gap-2 rounded-full glass-pill px-3.5 py-1.5 text-xs text-[#a3a3a3] border border-white/15 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shadow-[0_0_8px_rgba(255,214,10,0.8)]" />
            <span className="font-mono text-cyan-300 font-medium">Volaitile Friday v2.0</span>
            <span className="text-white/30">·</span>
            <span>Real-time developer workspaces</span>
          </div>
        </Reveal>

        {/* Primary Page Headline (Only H1 on Landing Page) */}
        <Reveal delay={80}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#fafafa] leading-[1.08] max-w-4xl mx-auto">
            Code together.{' '}
            <span className="block sm:inline">Ask Friday.{' '}</span>
            <span className="text-brand-yellow font-extrabold drop-shadow-[0_0_24px_rgba(255,214,10,0.35)]">
              Ship faster.
            </span>
          </h1>
        </Reveal>

        {/* One-sentence Subhead */}
        <Reveal delay={160}>
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#a3a3a3] max-w-2xl mx-auto leading-relaxed">
            Real-time project workspaces with a cloud file editor, live team chat, and a context-aware AI assistant in one place.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={240}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto h-11 px-7 inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-brand-yellow text-brand-black hover:bg-brand-amber transition-all shadow-[0_0_24px_rgba(255,214,10,0.35)] hover:shadow-[0_0_32px_rgba(255,214,10,0.5)] focus-ring"
            >
              Get started free
              <i className="ri-arrow-right-line ml-1.5 text-base" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium text-[#fafafa] glass hover:border-white/30 transition-all focus-ring"
            >
              Explore features
            </a>
          </div>
        </Reveal>

        {/* Tech Stack Chips (Plain Text) */}
        <Reveal delay={320}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-mono text-[#737373]">
            <span className="text-[#a3a3a3] uppercase tracking-wider mr-1">Built with</span>
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[#a3a3a3]"
              >
                {tech}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Interactive HTML/CSS Mockup with Parallax */}
        <div ref={mockupWrapperRef} className="mt-14 sm:mt-18 will-change-transform">
          <Reveal delay={200} transformOnly={true}>
            <ProductMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Hero;
