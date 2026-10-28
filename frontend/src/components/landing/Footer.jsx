import { Link } from 'react-router-dom';
import Logo from '../Logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-page/95 backdrop-blur-xl py-4 sm:py-5 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Logo & Tagline / Copyright (Row 1 on desktop, Row 2 on mobile) */}
          <div className="flex items-center gap-3 order-2 sm:order-1 text-center sm:text-left">
            <Logo size="sm" to="/" />
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="text-[#9D98AA] text-[11px] sm:text-xs">
              &copy; {currentYear} Volaitile Friday
            </span>
          </div>

          {/* Navigation Links (Row 1 on mobile, right side on desktop) */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-1 text-xs text-[#9D98AA] order-1 sm:order-2"
            aria-label="Footer Navigation"
          >
            <Link
              to="/features"
              className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 flex items-center hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              to="/faq"
              className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 flex items-center hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <Link
              to="/about"
              className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 flex items-center hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              to="/login"
              className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 flex items-center hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 flex items-center text-accent hover:underline font-medium"
            >
              Register
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
