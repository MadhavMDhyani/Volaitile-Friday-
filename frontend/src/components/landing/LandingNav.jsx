import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Why Friday', href: '#benefits' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-page/80 backdrop-blur-xl border-b border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <Logo size="md" to="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-medium text-[#a89384] hover:text-[#f3e6da] transition-colors focus-ring rounded py-1 px-1.5"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: Auth CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/login"
            viewTransition
            className="h-9 px-3.5 inline-flex items-center justify-center rounded-xl text-xs font-medium text-[#f3e6da] hover:text-white glass hover:border-white/30 transition-all focus-ring"
          >
            Log in
          </Link>
          <Link
            to="/register"
            viewTransition
            className="h-9 px-4 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_0_26px_rgb(var(--accent-rgb)/0.45)] focus-ring"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to="/register"
            viewTransition
            className="h-8 px-3 inline-flex items-center justify-center rounded-lg text-xs font-semibold bg-accent text-[#140d09]"
          >
            Start
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg glass text-[#a89384] hover:text-white focus-ring"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <i className={mobileMenuOpen ? 'ri-close-line text-lg' : 'ri-menu-line text-lg'} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-white/[0.12] bg-page/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-[#a89384] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <Link
              to="/login"
              viewTransition
              className="flex-1 py-2 text-center text-xs font-medium glass rounded-xl text-[#f3e6da]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              viewTransition
              className="flex-1 py-2 text-center text-xs font-semibold bg-accent text-[#140d09] rounded-xl"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
