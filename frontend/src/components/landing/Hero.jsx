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
    'MongoDB',
    'Redis (optional)',
    'Socket.IO',
    'Google Gemini AI',
  ];

  return (
    <section className="relative pt-16 pb-4 sm:pt-20 sm:pb-6 overflow-hidden">
      {/* ThreeUI Landscape Scene Background */}
      <HeroScene />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pointer-events-none">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full tile-pill px-3 py-1 text-[11px] sm:text-xs text-[#9D98AA] border border-white/15 mb-2 sm:mb-3 max-w-full animate-fade-in pointer-events-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.8)] shrink-0" />
          <span className="font-mono text-[#C9C6D5] font-medium whitespace-nowrap">Volaitile Friday</span>
          <span className="text-white/30 hidden sm:inline">·</span>
          <span className="truncate hidden sm:inline">Real-time developer workspaces</span>
        </div>

        {/* Primary Page Headline (Only H1 on Landing Page) */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F3FF] leading-[1.08] max-w-4xl mx-auto">
            Code together.{' '}
            <span className="block sm:inline">Ask Friday.{' '}</span>
            <span className="text-accent font-extrabold drop-shadow-[0_0_24px_rgb(var(--accent-rgb)/0.35)]">
              Ship faster.
            </span>
          </h1>
        </div>

        {/* One-sentence Subhead */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <p
            className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-[#9D98AA] max-w-2xl mx-auto leading-relaxed [text-wrap:balance]"
            style={{ textWrap: 'balance' }}
          >
            Real-time project workspaces with a cloud file editor, live team chat, and a context&#8209;aware AI assistant in one place.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-up pointer-events-auto" style={{ animationDelay: '180ms' }}>
          <Link
            to="/register"
            className="w-full sm:w-auto h-11 px-7 inline-flex items-center justify-center rounded-full text-sm font-semibold bg-primary text-[#070707] hover:bg-[#2da858] transition-all shadow-[0_0_24px_rgba(51,188,101,0.35)] hover:shadow-[0_0_36px_rgba(51,188,101,0.55)] focus-ring"
          >
            Get started free
            <i className="ri-arrow-right-line ml-1.5 text-base" />
          </Link>

          <Link
            to="/features"
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium text-[#F5F3FF] tile hover:border-white/30 transition-all focus-ring"
          >
            Explore features
          </Link>
        </div>

        {/* Tech Stack Chips (Plain Text) */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-mono text-[#6C667C] animate-fade-in pointer-events-auto" style={{ animationDelay: '240ms' }}>
          <span className="text-[#9D98AA] uppercase tracking-wider mr-1">Built with</span>
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[#9D98AA]"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Interactive HTML/CSS Mockup with Parallax */}
        <div ref={mockupWrapperRef} className="mt-5 sm:mt-7 will-change-transform pointer-events-auto">
          <Reveal delay={200} transformOnly={true}>
            <ProductMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Hero;

