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
    <header className="border-b border-[#262626] bg-[#0a0a0a]">
      {/* Top Navbar */}
      <div className="flex h-12 items-center justify-between px-3 sm:px-4">
        {/* Left: Back Link & Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/dashboard"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#a3a3a3] hover:bg-[#171717] hover:text-[#fafafa] transition-colors focus-ring"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <i className="ri-arrow-left-line text-base" />
          </Link>

          <div className="h-4 w-[1px] bg-[#262626]" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-xs sm:text-sm text-[#fafafa] truncate">
              {project?.name || 'Project Workspace'}
            </span>

            {isOwner && (
              <span className="hidden sm:inline-flex items-center rounded border border-[#404040] bg-[#171717] px-1.5 py-0.2 text-[10px] font-mono text-[#a3a3a3]">
                Owner
              </span>
            )}
          </div>
        </div>

        {/* Right: Members & Account Menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={onOpenMembers}
            icon={<i className="ri-group-line text-xs" />}
            title="View project members"
            aria-label="View project members"
          >
            <span className="hidden sm:inline">Members</span>
            <span className="font-mono text-[10px] bg-[#171717] px-1 rounded text-[#a3a3a3]">
              {project?.users?.length || 1}
            </span>
          </Button>

          <AccountMenu />
        </div>
      </div>

      {/* Mobile Tab Switcher (< md screens) */}
      <div className="flex md:hidden border-t border-[#262626] bg-[#111111] px-2 text-xs">
        <button
          type="button"
          onClick={() => onSelectMobileTab('files')}
          className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors duration-150 focus-ring ${
            mobileTab === 'files'
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
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
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
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
              ? 'border-white text-white'
              : 'border-transparent text-[#737373] hover:text-[#a3a3a3]'
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
