import { useState, useEffect, useContext } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Logo from '../Logo';
import { UserContext } from '../../context/user.context';

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useContext(UserContext);
  const location = useLocation();

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

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Features', to: '/features' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'Why Friday', to: '/why-friday' },
    { label: 'About', to: '/about' },
    { label: 'FAQ', to: '/faq' },
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
        {/* Left: Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Logo size="md" to="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-xs font-medium transition-colors focus-ring rounded py-1 px-1.5 ${
                    isActive
                      ? 'text-accent font-semibold'
                      : 'text-[#a89384] hover:text-[#f3e6da]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Auth CTAs / Dashboard Access */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="h-9 px-4 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_0_26px_rgb(var(--accent-rgb)/0.45)] focus-ring"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="h-9 px-3.5 inline-flex items-center justify-center rounded-xl text-xs font-medium text-[#f3e6da] hover:text-white glass hover:border-white/30 transition-all focus-ring"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="h-9 px-4 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_0_26px_rgb(var(--accent-rgb)/0.45)] focus-ring"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          {user ? (
            <Link
              to="/dashboard"
              className="h-9 px-3 inline-flex items-center justify-center rounded-lg text-xs font-semibold bg-accent text-[#140d09]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="h-9 px-3 inline-flex items-center justify-center rounded-lg text-xs font-semibold bg-accent text-[#140d09]"
            >
              Start
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg glass text-[#a89384] hover:text-white focus-ring"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-sheet"
          >
            <i className={mobileMenuOpen ? 'ri-close-line text-lg' : 'ri-menu-line text-lg'} />
          </button>
        </div>
      </div>

      {/* Full-screen Mobile Glass Sheet */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-sheet"
          className="sm:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#140d09]/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto animate-fade-in border-t border-white/10"
        >
          <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `min-h-[48px] px-4 rounded-xl text-base font-medium flex items-center transition-colors ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                      : 'text-[#a89384] hover:text-[#f3e6da] hover:bg-white/[0.04]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[48px] inline-flex items-center justify-center rounded-xl text-base font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
              >
                Open dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl text-base font-medium glass text-[#f3e6da] hover:border-white/30 transition-all focus-ring"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl text-base font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
