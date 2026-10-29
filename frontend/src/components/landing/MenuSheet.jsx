import { useEffect, useRef, useState, useContext, useId } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/user.context';
import AboutSection from './AboutSection';
import FeatureBento from './FeatureBento';
import HowItWorks from './HowItWorks';
import ChatDemo from './ChatDemo';
import Benefits from './Benefits';
import FAQ from './FAQ';
import Logo from '../Logo';

const TABS = [
  { id: 'about', label: 'About', path: '/about', icon: 'ri-information-line' },
  { id: 'features', label: 'Features', path: '/features', icon: 'ri-sparkling-2-line' },
  { id: 'how-it-works', label: 'How it works', path: '/how-it-works', icon: 'ri-terminal-box-line' },
  { id: 'why-friday', label: 'Why Friday', path: '/why-friday', icon: 'ri-shield-check-line' },
  { id: 'faq', label: 'FAQ', path: '/faq', icon: 'ri-question-line' },
];

export const MenuSheet = ({
  isOpen = false,
  activeTab = 'about',
  onTabChange,
  onClose,
  triggerRef,
}) => {
  const { user } = useContext(UserContext);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tabContentKey, setTabContentKey] = useState(activeTab);
  const [tabSwitching, setTabSwitching] = useState(false);

  const [desktopIndicator, setDesktopIndicator] = useState({ top: 0, height: 44, ready: false });
  const [mobileIndicator, setMobileIndicator] = useState({ left: 0, width: 80, ready: false });

  const dialogRef = useRef(null);
  const tabListDesktopRef = useRef(null);
  const tabListMobileRef = useRef(null);
  const closeButtonDesktopRef = useRef(null);
  const closeButtonMobileRef = useRef(null);
  const previousActiveElement = useRef(null);
  const contentAreaRef = useRef(null);

  const titleId = useId();

  // Reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sync mounted lifecycle with smooth entry/exit animations
  useEffect(() => {
    let timerId;
    let rafId;

    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      if (prefersReducedMotion) {
        timerId = setTimeout(() => {
          setIsRendered(true);
          setIsOpening(false);
          setIsClosing(false);
        }, 0);
      } else {
        timerId = setTimeout(() => {
          setIsRendered(true);
          setIsOpening(true);
          setIsClosing(false);
        }, 0);
        rafId = requestAnimationFrame(() => {
          setIsOpening(false);
        });
      }
    } else if (isRendered) {
      if (prefersReducedMotion) {
        timerId = setTimeout(() => {
          setIsRendered(false);
          setIsOpening(false);
          setIsClosing(false);
        }, 0);
      } else {
        timerId = setTimeout(() => {
          setIsClosing(true);
          setIsOpening(false);
          timerId = setTimeout(() => {
            setIsRendered(false);
            setIsClosing(false);
          }, 260);
        }, 0);
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, prefersReducedMotion, isRendered]);

  // Tab content transition on tab change (150ms fade/translate)
  useEffect(() => {
    let timerId;
    if (activeTab !== tabContentKey) {
      if (prefersReducedMotion) {
        timerId = setTimeout(() => {
          setTabContentKey(activeTab);
        }, 0);
      } else {
        timerId = setTimeout(() => {
          setIsClosing(false);
          setTabSwitching(true);
          timerId = setTimeout(() => {
            setTabContentKey(activeTab);
            setTabSwitching(false);
            if (contentAreaRef.current) {
              contentAreaRef.current.scrollTop = 0;
            }
          }, 150);
        }, 0);
      }
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [activeTab, tabContentKey, prefersReducedMotion]);

  // Sliding active-tab indicator position calculation (transform only)
  useEffect(() => {
    if (!isRendered) return;

    const updateIndicators = () => {
      if (tabListDesktopRef.current) {
        const activeBtn = tabListDesktopRef.current.querySelector(
          `#tab-desktop-${activeTab}`
        );
        if (activeBtn) {
          setDesktopIndicator({
            top: activeBtn.offsetTop,
            height: activeBtn.offsetHeight,
            ready: true,
          });
        }
      }

      if (tabListMobileRef.current) {
        const activeBtn = tabListMobileRef.current.querySelector(
          `#tab-mobile-${activeTab}`
        );
        if (activeBtn) {
          setMobileIndicator({
            left: activeBtn.offsetLeft,
            width: activeBtn.offsetWidth,
            ready: true,
          });
          activeBtn.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }
    };

    updateIndicators();
    const timer = setTimeout(updateIndicators, 20);
    return () => clearTimeout(timer);
  }, [activeTab, isRendered, prefersReducedMotion]);

  // Lock body scroll and set background inert/aria-hidden while open
  useEffect(() => {
    if (!isRendered) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('menu-open');

    const mainEl = document.getElementById('main-content');
    const headerEl = document.querySelector('header');
    const footerEl = document.querySelector('footer');

    if (mainEl) {
      mainEl.setAttribute('aria-hidden', 'true');
      if ('inert' in mainEl) mainEl.setAttribute('inert', '');
    }
    if (headerEl) {
      headerEl.setAttribute('aria-hidden', 'true');
      if ('inert' in headerEl) headerEl.setAttribute('inert', '');
    }
    if (footerEl) {
      footerEl.setAttribute('aria-hidden', 'true');
      if ('inert' in footerEl) footerEl.setAttribute('inert', '');
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('menu-open');
      if (mainEl) {
        mainEl.removeAttribute('aria-hidden');
        mainEl.removeAttribute('inert');
      }
      if (headerEl) {
        headerEl.removeAttribute('aria-hidden');
        headerEl.removeAttribute('inert');
      }
      if (footerEl) {
        footerEl.removeAttribute('aria-hidden');
        footerEl.removeAttribute('inert');
      }
    };
  }, [isRendered]);

  // Focus management: focus on open, return focus on close
  useEffect(() => {
    if (isRendered && !isClosing && !isOpening) {
      const timer = setTimeout(() => {
        const isDesktop = window.innerWidth >= 768;
        const targetTab = isDesktop
          ? tabListDesktopRef.current?.querySelector(`#tab-desktop-${activeTab}`)
          : tabListMobileRef.current?.querySelector(`#tab-mobile-${activeTab}`);

        if (targetTab) {
          targetTab.focus();
        } else if (closeButtonDesktopRef.current) {
          closeButtonDesktopRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isRendered && previousActiveElement.current) {
      const target = triggerRef?.current || previousActiveElement.current;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    }
  }, [isRendered, isClosing, isOpening, activeTab, triggerRef]);

  // Keyboard trap and Escape listener
  useEffect(() => {
    if (!isRendered) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusables = dialog.querySelectorAll(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const visibleFocusables = Array.from(focusables).filter(
          (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
        );

        if (visibleFocusables.length === 0) return;

        const firstEl = visibleFocusables[0];
        const lastEl = visibleFocusables[visibleFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, onClose]);

  // Roving tabindex and Arrow / Home / End navigation for tabs
  const handleTabKeyDown = (e, currentIndex, isDesktop) => {
    let targetIndex = null;
    const count = TABS.length;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % count;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + count) % count;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = count - 1;
    }

    if (targetIndex !== null) {
      const nextTab = TABS[targetIndex];
      onTabChange(nextTab.id);

      const tablist = isDesktop
        ? tabListDesktopRef.current
        : tabListMobileRef.current;
      const prefix = isDesktop ? 'tab-desktop-' : 'tab-mobile-';
      const nextBtn = tablist?.querySelector(`#${prefix}${nextTab.id}`);
      if (nextBtn) {
        nextBtn.focus();
      }
    }
  };

  if (!isRendered) return null;

  // 60fps Motion: Animate ONLY transform and opacity (no backdrop-filter animation on panel)
  const isEnteringOrClosing = isOpening || isClosing;

  const backdropTransition = prefersReducedMotion
    ? 'opacity-100'
    : isEnteringOrClosing
    ? 'opacity-0 transition-opacity duration-200 ease-out'
    : 'opacity-100 transition-opacity duration-200 ease-out';

  // Desktop panel: scale 0.98 -> 1 and translateY 12px -> 0 over 260ms cubic-bezier(0.22,1,0.36,1)
  const desktopPanelTransform = prefersReducedMotion
    ? 'transform-none'
    : isEnteringOrClosing
    ? 'scale-[0.98] translate-y-3 transition-transform duration-200 ease-in'
    : 'scale-100 translate-y-0 transition-transform duration-[260ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]';

  // Mobile panel: slide up from bottom translateY(100%) -> translateY(0)
  const mobilePanelTransform = prefersReducedMotion
    ? 'transform-none'
    : isEnteringOrClosing
    ? 'translate-y-full transition-transform duration-200 ease-in'
    : 'translate-y-0 transition-transform duration-[260ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]';

  // Inner content fade/translate (150ms)
  const contentFadeStyle = prefersReducedMotion
    ? ''
    : tabSwitching
    ? 'opacity-0 translate-y-2 transition-all duration-150 ease-out'
    : 'opacity-100 translate-y-0 transition-all duration-150 ease-out';

  const activeTabMeta = TABS.find((t) => t.id === tabContentKey) || TABS[0];

  return createPortal(
    <div
      ref={dialogRef}
      id="menu-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Scrim — tints page (page itself is blurred by body.menu-open) */}
      <div
        className={`fixed inset-0 bg-[#0B0716]/60 backdrop-blur-sm ${backdropTransition}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop Centered tile Panel (>= 768px) */}
      <div
        className={`hidden md:flex relative z-10 w-[92vw] max-w-[960px] h-[82dvh] max-h-[82dvh] rounded-3xl tile overflow-hidden ${desktopPanelTransform}`}
      >
        {/* Left Column: Vertical ARIA Tabs with Sliding Active Indicator */}
        <div className="w-64 shrink-0 border-r border-white/10 p-5 flex flex-col justify-between bg-tile-raised">
          <div>
            {/* Header Brand */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-5">
              <Logo size="sm" to="/" onClick={onClose} />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-accent/30 bg-accent/10 text-accent font-semibold">
                MENU
              </span>
            </div>

            {/* Accessible Tablist with Sliding Indicator */}
            <div
              ref={tabListDesktopRef}
              role="tablist"
              aria-orientation="vertical"
              aria-label="Navigation sections"
              className="relative flex flex-col space-y-1.5"
            >
              {/* Sliding Active Tab Indicator (pure transform) */}
              <div
                aria-hidden="true"
                className={`absolute left-0 right-0 rounded-xl bg-accent/15 border border-accent/40 shadow-[0_0_16px_rgb(var(--accent-rgb)/0.18)] pointer-events-none ${
                  prefersReducedMotion
                    ? ''
                    : 'transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]'
                }`}
                style={{
                  top: 0,
                  height: `${desktopIndicator.height}px`,
                  transform: `translate3d(0, ${desktopIndicator.top}px, 0)`,
                  opacity: desktopIndicator.ready ? 1 : 0,
                  willChange: 'transform',
                }}
              />

              {TABS.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-desktop-${tab.id}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    aria-controls={`panel-desktop-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onTabChange(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx, true)}
                    className={`relative z-10 min-h-[44px] w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors focus-ring text-left cursor-pointer ${
                      isActive
                        ? 'text-accent font-semibold'
                        : 'text-[#9D98AA] hover:text-[#F5F3FF] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <i className={`${tab.icon} text-base ${isActive ? 'text-accent' : 'text-[#9D98AA]'}`} />
                      <span>{tab.label}</span>
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Controls / Auth */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={onClose}
                className="w-full min-h-[44px] inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#18102B] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
              >
                Open dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl text-xs font-medium tile text-[#F5F3FF] transition-all focus-ring"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#18102B] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
                >
                  Get started
                </Link>
              </div>
            )}
            <div className="text-[10px] font-mono text-[#6C667C] text-center pt-1">
              Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-[#9D98AA]">Esc</kbd> to close
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-tile overflow-hidden">
          {/* Top Bar with Title and Close Button */}
          <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-tile-raised">
            <h2
              id={titleId}
              className="text-sm font-semibold text-[#F5F3FF] flex items-center gap-2"
            >
              <i className={`${activeTabMeta.icon} text-accent text-base`} />
              <span>{activeTabMeta.label}</span>
            </h2>

            <button
              ref={closeButtonDesktopRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl tile text-[#9D98AA] hover:text-[#F5F3FF] transition-all focus-ring cursor-pointer"
            >
              <i className="ri-close>
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Scrolling Tab Panel Content */}
          <div
            ref={contentAreaRef}
            id={`panel-desktop-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-desktop-${activeTab}`}
            tabIndex={0}
            className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 custom-scrollbar focus-ring"
          >
            <div className={contentFadeStyle}>
              {tabContentKey === 'about' && <AboutSection compact={true} />}
              {tabContentKey === 'features' && <FeatureBento compact={true} />}
              {tabContentKey === 'how-it-works' && (
                <div className="space-y-6">
                  <HowItWorks compact={true} />
                  <ChatDemo compact={true} />
                </div>
              )}
              {tabContentKey === 'why-friday' && <Benefits compact={true} />}
              {tabContentKey === 'faq' && <FAQ compact={true} />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Sheet (< 768px) */}
      <div
        className={`md:hidden fixed inset-0 z-10 h-[100dvh] w-full flex flex-col tile text-[#F5F3FF] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-hidden ${mobilePanelTransform}`}
      >
        {/* Mobile Header Bar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <Logo size="sm" to="/" onClick={onClose} />

          <button
            ref={closeButtonMobileRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl tile text-[#9D98AA] hover:text-[#F5F3FF] transition-all focus-ring cursor-pointer"
          >
            <i className="ri-close>
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Mobile Horizontal Snap-Scrolling Tab Strip with Sliding Indicator */}
        <div
          ref={tabListMobileRef}
          role="tablist"
          aria-orientation="horizontal"
          aria-label="Navigation sections"
          className="relative flex items-center gap-2 px-4 py-2 border-b border-white/10 overflow-x-auto snap-x snap-mandatory shrink-0 no-scrollbar"
        >
          {/* Mobile Sliding Active Indicator (transform only) */}
          <div
            aria-hidden="true"
            className={`absolute top-2 bottom-2 rounded-xl bg-accent/15 border border-accent/40 shadow-[0_0_12px_rgb(var(--accent-rgb)/0.2)] pointer-events-none ${
              prefersReducedMotion
                ? ''
                : 'transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]'
            }`}
            style={{
              left: 0,
              width: `${mobileIndicator.width}px`,
              transform: `translate3d(${mobileIndicator.left}px, 0, 0)`,
              opacity: mobileIndicator.ready ? 1 : 0,
              willChange: 'transform',
            }}
          />

          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-mobile-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-mobile-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx, false)}
                className={`relative z-10 min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap snap-start shrink-0 flex items-center gap-2 transition-colors focus-ring cursor-pointer ${
                  isActive
                    ? 'text-accent font-semibold'
                    : 'text-[#9D98AA] hover:text-[#F5F3FF] tile border border-white/10'
                }`}
              >
                <i className={`${tab.icon} text-sm ${isActive ? 'text-accent' : 'text-[#9D98AA]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Content Area */}
        <div
          id={`panel-mobile-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-mobile-${activeTab}`}
          tabIndex={0}
          className="flex-1 overflow-y-auto overscroll-contain p-4 custom-scrollbar focus-ring"
        >
          <div className={contentFadeStyle}>
            {tabContentKey === 'about' && <AboutSection compact={true} />}
            {tabContentKey === 'features' && <FeatureBento compact={true} />}
            {tabContentKey === 'how-it-works' && (
              <div className="space-y-6">
                <HowItWorks compact={true} />
                <ChatDemo compact={true} />
              </div>
            )}
            {tabContentKey === 'why-friday' && <Benefits compact={true} />}
            {tabContentKey === 'faq' && <FAQ compact={true} />}
          </div>
        </div>

        {/* Mobile Bottom Auth CTAs */}
        <div className="shrink-0 p-4 border-t border-white/10 bg-tile-raised">
          {user ? (
            <Link
              to="/dashboard"
              onClick={onClose}
              className="w-full min-h-[44px] inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-accent text-[#18102B] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
            >
              Open dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                onClick={onClose}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl text-sm font-medium tile text-[#F5F3FF] transition-all focus-ring"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-accent text-[#18102B] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MenuSheet;


