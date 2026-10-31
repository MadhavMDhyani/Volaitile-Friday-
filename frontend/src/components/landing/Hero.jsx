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
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full tile-pill px-3 py-1 text-[11px] sm:text-xs text-[rgba(255,255,255,0.55)] border border-white/15 mb-2 sm:mb-3 max-w-full animate-fade-in pointer-events-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgb(var(--accent-rgb)/0.8)] shrink-0" />
          <span className="font-mono text-[rgba(255,255,255,0.70)] font-medium whitespace-nowrap">Volaitile Friday</span>
          <span className="text-white/30 hidden sm:inline">Â·</span>
          <span className="truncate hidden sm:inline">Real-time developer workspaces</span>
        </div>

        {/* Primary Page Headline (Only H1 on Landing Page) */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
            Code together.{' '}
            <span className="block sm:inline">Ask Friday.{' '}</span>
            <span className="text-primary font-medium drop-shadow-[0_0_24px_rgba(51,188,101,0.35)]">
              Ship faster.
            </span>
          </h1>
        </div>

        {/* One-sentence Subhead */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <p
            className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-text-muted max-w-2xl mx-auto leading-relaxed [text-wrap:balance]"
            style={{ textWrap: 'balance' }}
          >
            Real-time project workspaces with a cloud file editor, live team chat, and a context&#8209;aware AI assistant in one place.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-up pointer-events-auto" style={{ animationDelay: '180ms' }}>
          <Link
            to="/register"
            className="w-full sm:w-auto h-11 px-7 inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-[#070707] hover:shadow-[0_0_24px_rgba(93,255,217,0.45)] transition-all focus-ring"
          >
            Get started free
            <i className="ri-arrow-right-line ml-1.5 text-base" />
          </Link>

          <Link
            to="/features"
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center rounded-full text-sm font-medium text-white tile hover:border-accent transition-all focus-ring"
          >
            Explore features
          </Link>
        </div>

        {/* Tech Stack Chips (Plain Text) */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-mono text-[rgba(255,255,255,0.35)] animate-fade-in pointer-events-auto" style={{ animationDelay: '240ms' }}>
          <span className="text-text-muted uppercase tracking-wider mr-1">Built with</span>
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-glass-border bg-glass-bg px-3 py-1 text-text-muted"
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

