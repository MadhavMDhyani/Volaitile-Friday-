import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductMockup from './ProductMockup';
import Reveal from './Reveal';
import HeroScene from './HeroScene';

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
      {/* ThreeUI Landscape Scene Background */}
      <HeroScene />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pointer-events-none">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full glass-pill px-3 py-1 text-[11px] sm:text-xs text-[#a89384] border border-white/15 mb-6 max-w-full animate-fade-in pointer-events-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.8)] shrink-0" />
          <span className="font-mono text-[#c4b5a8] font-medium whitespace-nowrap">Volaitile Friday</span>
          <span className="text-white/30 hidden sm:inline">·</span>
          <span className="truncate hidden sm:inline">Real-time developer workspaces</span>
        </div>

        {/* Primary Page Headline (Only H1 on Landing Page) */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f3e6da] leading-[1.08] max-w-4xl mx-auto">
            Code together.{' '}
            <span className="block sm:inline">Ask Friday.{' '}</span>
            <span className="text-accent font-extrabold drop-shadow-[0_0_24px_rgb(var(--accent-rgb)/0.35)]">
              Ship faster.
            </span>
          </h1>
        </div>

        {/* One-sentence Subhead */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-[#a89384] max-w-2xl mx-auto leading-relaxed">
            Real-time project workspaces with a cloud file editor, live team chat, and a context-aware AI assistant in one place.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-up pointer-events-auto" style={{ animationDelay: '180ms' }}>
          <Link
            to="/register"
            className="w-full sm:w-auto h-11 px-7 inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_24px_rgb(var(--accent-rgb)/0.35)] hover:shadow-[0_0_32px_rgb(var(--accent-rgb)/0.5)] focus-ring"
          >
            Get started free
            <i className="ri-arrow-right-line ml-1.5 text-base" />
          </Link>

          <Link
            to="/features"
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium text-[#f3e6da] glass hover:border-white/30 transition-all focus-ring"
          >
            Explore features
          </Link>
        </div>

        {/* Tech Stack Chips (Plain Text) */}
        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-mono text-[#6e5d50] animate-fade-in pointer-events-auto" style={{ animationDelay: '240ms' }}>
          <span className="text-[#a89384] uppercase tracking-wider mr-1">Built with</span>
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[#a89384]"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Interactive HTML/CSS Mockup with Parallax */}
        <div ref={mockupWrapperRef} className="mt-14 sm:mt-18 will-change-transform pointer-events-auto">
          <Reveal delay={200} transformOnly={true}>
            <ProductMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Hero;
