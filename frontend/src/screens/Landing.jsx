import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import Footer from '../components/landing/Footer';
import MenuSheet from '../components/landing/MenuSheet';
import usePageMeta from '../hooks/usePageMeta';

const TAB_METAS = {
  about: {
    title: 'About | Volaitile Friday',
    description:
      'Learn about Volaitile Friday: an engineering workspace uniting cloud file editing, live team chat, and Friday AI into one synchronized canvas.',
  },
  features: {
    title: 'Features | Volaitile Friday',
    description:
      'Explore Volaitile Friday features: real-time room chat, in-browser file workspace, team access controls, and Friday AI.',
  },
  'how-it-works': {
    title: 'How It Works | Volaitile Friday',
    description:
      'From zero to shipping in 3 steps with Volaitile Friday: create projects, invite teammates, and code with Friday AI.',
  },
  'why-friday': {
    title: 'Why Friday | Volaitile Friday',
    description:
      'Why engineering teams choose Volaitile Friday: eliminate context-switching, reduce developer friction, and ship faster.',
  },
  faq: {
    title: 'FAQ | Volaitile Friday',
    description:
      'Frequently asked questions about Volaitile Friday architecture, security, self-hosting, and resource limits.',
  },
};

const DEFAULT_META = {
  title: 'Volaitile Friday - Code together. Ask Friday. Ship faster.',
  description:
    'Real-time project workspaces with a cloud file editor, live team chat, and a context-aware AI assistant in one place.',
};

export const Landing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const triggerRef = useRef(null);

  // Single source of truth for sheet open state and active tab from URL
  const validTabs = ['about', 'features', 'how-it-works', 'why-friday', 'faq'];
  const pathSegment = location.pathname.replace(/^\//, '');
  const isSheetOpen = validTabs.includes(pathSegment);
  const activeTab = isSheetOpen ? pathSegment : 'about';

  // Synchronize title and meta description with current tab or default
  usePageMeta(isSheetOpen && TAB_METAS[activeTab] ? TAB_METAS[activeTab] : DEFAULT_META);

  const handleOpenMenu = () => {
    navigate('/about');
  };

  const handleCloseMenu = () => {
    navigate('/');
  };

  const handleTabChange = (tabId) => {
    navigate(`/${tabId}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white selection:bg-[#F5F3FF] selection:text-[#110B20] overflow-x-hidden flex flex-col justify-between">
      {/* Sticky Translucent tile Header with Three-Bars Button */}
      <LandingNav
        isOpen={isSheetOpen}
        onToggleMenu={isSheetOpen ? handleCloseMenu : handleOpenMenu}
        triggerRef={triggerRef}
      />

      {/* Main Landing Hero (Shrunk, minimal scrolling) */}
      <main id="main-content" className="flex-1">
        <Hero />
      </main>

      {/* Slim Footer */}
      <Footer />

      {/* Accessible tile Dialog MenuSheet */}
      <MenuSheet
        isOpen={isSheetOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onClose={handleCloseMenu}
        triggerRef={triggerRef}
      />
    </div>
  );
};

export default Landing;

