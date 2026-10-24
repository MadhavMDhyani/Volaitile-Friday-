import { Link } from 'react-router-dom';
import AccountMenu from '../../components/AccountMenu';
import Button from '../../components/Button';

export const ProjectHeader = ({
  project,
  isOwner,
  onOpenMembers,
  mobileTab,
  onSelectMobileTab,
}) => {
  return (
    <header className="border-b border-white/[0.08] bg-page/75 backdrop-blur-xl sticky top-0 z-30">
      {/* Top Navbar */}
      <div className="flex h-12 items-center justify-between px-3 sm:px-4">
        {/* Left: Back Link & Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <Link
            to="/dashboard"
            viewTransition
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg glass border-glass-border/50 text-[#a89384] hover:text-[#f3e6da] hover:border-accent/40 transition-colors focus-ring"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <i className="ri-arrow-left-line text-base" />
          </Link>

          <div className="h-4 w-[1px] bg-white/[0.1] shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-xs sm:text-sm text-[#f3e6da] tracking-wide truncate">
              {project?.name || 'Project Workspace'}
            </span>

            {isOwner && (
              <span className="shrink-0 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-mono text-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.2)]">
                Owner
              </span>
            )}
          </div>
        </div>

        {/* Right: Members & Account Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="xs"
            onClick={onOpenMembers}
            icon={<i className="ri-group-line text-xs" />}
            title="View project members"
            aria-label="View project members"
            className="h-8"
          >
            <span className="hidden sm:inline">Members</span>
            <span className="font-mono text-[10px] tabular-nums bg-white/[0.08] px-1.5 py-0.5 rounded-full text-white/80">
              {project?.users?.length || 1}
            </span>
          </Button>

          <AccountMenu />
        </div>
      </div>

      {/* Mobile Tab Switcher (< md screens) */}
      <div className="flex md:hidden border-t border-white/[0.08] bg-raised/80 backdrop-blur-md px-2 text-xs">
        <button
          type="button"
          onClick={() => onSelectMobileTab('files')}
          className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors duration-150 focus-ring ${
            mobileTab === 'files'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-[#6e5d50] hover:text-[#a89384]'
          }`}
        >
          <i className="ri-file-code-line mr-1 text-xs" />
          Files
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileTab('chat')}
          className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors duration-150 focus-ring ${
            mobileTab === 'chat'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-[#6e5d50] hover:text-[#a89384]'
          }`}
        >
          <i className="ri-chat-3-line mr-1 text-xs" />
          Chat & AI
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileTab('members')}
          className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors duration-150 focus-ring ${
            mobileTab === 'members'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-[#6e5d50] hover:text-[#a89384]'
          }`}
        >
          <i className="ri-group-line mr-1 text-xs" />
          Members
        </button>
      </div>
    </header>
  );
};

export default ProjectHeader;
