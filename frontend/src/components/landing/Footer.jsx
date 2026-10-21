import { Link } from 'react-router-dom';
import Logo from '../Logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-page/95 backdrop-blur-xl py-12 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo size="md" to="/" />
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="text-xs text-[#a3a3a3]">
              Real-time engineering workspaces &amp; Friday AI
            </span>
          </div>

          {/* Section Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#a3a3a3]" aria-label="Footer Navigation">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Why Friday
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-accent hover:underline">
              Register
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737373]">
          <p className="tabular-nums">
            &copy; {currentYear} Volaitile Friday. Built with React 19, Node.js, Express, MongoDB, and Redis.
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span>Systems fully operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
