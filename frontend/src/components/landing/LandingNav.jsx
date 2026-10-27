import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import { UserContext } from '../../context/user.context';

export const LandingNav = ({
  isOpen: propIsOpen,
  onToggleMenu: propOnToggleMenu,
  triggerRef,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  // If props aren't provided, derive from URL single source of truth
  const validTabs = ['about', 'features', 'how-it-works', 'why-friday', 'faq'];
  const currentTab = location.pathname.replace(/^\//, '');
  const isSheetOpenFromUrl = validTabs.includes(currentTab);
  const isOpen = propIsOpen !== undefined ? propIsOpen : isSheetOpenFromUrl;

  const handleToggle = () => {
    if (propOnToggleMenu) {
      propOnToggleMenu();
    } else if (isOpen) {
      navigate('/');
    } else {
      navigate('/about');
    }
  };

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

  return (
    <header
      id="landing-nav-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-page/80 backdrop-blur-xl border-b border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center">
          <Logo size="md" to="/" />
        </div>

        {/* Right: Auth Buttons & Three-Bars Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="min-h-[44px] px-3.5 sm:px-4 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_0_26px_rgb(var(--accent-rgb)/0.45)] focus-ring"
            >
              <span className="hidden sm:inline">Open dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          ) : (
            <>
              {/* Log in button hidden on phones */}
              <Link
                to="/login"
                className="hidden sm:inline-flex min-h-[44px] px-3.5 items-center justify-center rounded-xl text-xs font-medium text-[#f3e6da] hover:text-white glass hover:border-white/30 transition-all focus-ring"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="min-h-[44px] px-3.5 sm:px-4 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_0_26px_rgb(var(--accent-rgb)/0.45)] focus-ring"
              >
                Get started
              </Link>
            </>
          )}

          {/* Single Three-Bars Hamburger Button on all screen sizes */}
          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggle}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="menu-sheet"
            className="min-h-[44px] min-w-[44px] h-11 w-11 inline-flex flex-col items-center justify-center gap-1.5 rounded-xl glass text-[#a89384] hover:text-[#f3e6da] hover:border-white/30 transition-all focus-ring cursor-pointer"
          >
            {/* Animated three bars using CSS transforms only */}
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-transform duration-200 ease-out origin-center ${
                isOpen ? 'translate-y-2 rotate-45' : 'translate-y-0 rotate-0'
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-200 ease-out ${
                isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-transform duration-200 ease-out origin-center ${
                isOpen ? '-translate-y-2 -rotate-45' : 'translate-y-0 rotate-0'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
