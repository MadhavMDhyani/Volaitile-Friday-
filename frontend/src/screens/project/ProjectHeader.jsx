import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountMenu from '../../components/AccountMenu';
import Button from '../../components/Button';

export const ProjectHeader = ({
  project,
  isOwner,
  onOpenMembers,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="border-b border-white/[0.08] bg-tile-deep sticky top-0 z-30">
      <div className="flex h-12 items-center justify-between px-3 sm:px-4">
        {/* Left: Back Link & Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <Link
            to="/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg tile-raised border-glass-border/50 text-[#9D98AA] hover:text-[#F5F3FF] hover:border-accent/40 transition-all focus-ring"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <i className="ri-arrow-left-line text-base" />
          </Link>

          <div className="h-4 w-[1px] bg-white/[0.1] shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-xs sm:text-sm text-[#F5F3FF] tracking-wide truncate">
              {project?.name || 'Project Workspace'}
            </span>

            {isOwner && (
              <span className="shrink-0 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-mono text-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.2)]">
                Owner
              </span>
            )}
          </div>
        </div>

        {/* Right: Desktop Actions (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="xs"
            onClick={onOpenMembers}
            icon={<i className="ri-group-line text-xs" />}
            title="View project members"
            aria-label="View project members"
            className="h-8"
          >
            <span>Members</span>
            <span className="font-mono text-[10px] tabular-nums bg-white/[0.08] px-1.5 py-0.5 rounded-full text-white/80">
              {project?.users?.length || 1}
            </span>
          </Button>

          <AccountMenu />
        </div>

        {/* Right: Mobile / Tablet Actions (< 1024px) - Secondary actions in menu */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0 relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg tile-raised text-[#9D98AA] hover:text-[#F5F3FF] focus-ring"
            aria-label="Workspace secondary actions"
            aria-expanded={isMenuOpen}
          >
            <i className="ri-more-2-fill text-base" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-8 top-10 w-48 rounded-xl tile border border-white/10 p-1.5 shadow-2xl z-50 animate-scale-in text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenMembers();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[#F5F3FF] hover:bg-white/[0.06] text-left transition-colors"
              >
                <span className="flex items-center gap-2">
                  <i className="ri-group-line text-accent" />
                  Members
                </span>
                <span className="text-[10px] tabular-nums bg-white/10 px-1.5 py-0.5 rounded-full text-white/80">
                  {project?.users?.length || 1}
                </span>
              </button>
            </div>
          )}

          <AccountMenu />
        </div>
      </div>
    </header>
  );
};

export default ProjectHeader;

