import Skeleton from '../Skeleton';
import Button from '../Button';

export const StatCards = ({
  projects = [],
  loadingProjects = false,
  projectStats = { totalFiles: 0, totalLines: 0, loading: false },
  currentUserId,
  error = '',
  onRetry,
}) => {
  if (loadingProjects) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="tile flex flex-col justify-between rounded-2xl p-4 h-28"
          >
            <div className="flex items-center justify-between">
              <Skeleton width="45%" height="14px" />
              <Skeleton width="28px" height="28px" rounded="rounded-xl" />
            </div>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="80%" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent-deep bg-accent-tint/40 p-4 text-xs text-accent">
        <div className="flex items-center gap-2">
          <i className="ri-error-warning-line text-base text-accent" />
          <span>{error}</span>
        </div>
        {onRetry && (
          <Button variant="secondary" size="xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  const totalProjects = projects.length;
  let ownedCount = 0;
  const uniqueCollaborators = new Set();

  projects.forEach((proj) => {
    const ownerId = proj.owner?._id ? proj.owner._id.toString() : proj.owner?.toString();
    if (ownerId && currentUserId && ownerId === currentUserId) {
      ownedCount++;
    }
    if (Array.isArray(proj.users)) {
      proj.users.forEach((u) => {
        const uId = u?._id ? u._id.toString() : u?.toString();
        if (uId && uId !== currentUserId) {
          uniqueCollaborators.add(uId);
        }
      });
    }
  });

  const memberCount = Math.max(0, totalProjects - ownedCount);
  const ownedPercent = totalProjects > 0 ? Math.round((ownedCount / totalProjects) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {/* 1. Total Projects */}
      <div className="tile rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9D98AA]">Total Projects</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-tile-raised text-accent">
            <i className="ri-folder-3-line text-sm" />
          </div>
        </div>
        <div className="font-mono text-2xl font-bold tracking-tight text-[#F5F3FF] tabular-nums">
          {totalProjects}
        </div>
        <p className="mt-1 text-[11px] text-[#6C667C]">Active developer workspaces</p>
      </div>

      {/* 2. Ownership */}
      <div className="tile rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9D98AA]">Ownership</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-tile-raised text-[#C9C6D5]">
            <i className="ri-shield-user-line text-sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-[#F5F3FF] tabular-nums">{ownedCount}</span>
          <span className="text-xs font-mono text-[#6C667C] tabular-nums">/ {totalProjects} owned</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${ownedPercent}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-[#6C667C] tabular-nums">{ownedCount} owned · {memberCount} shared</p>
      </div>

      {/* 3. Codebase */}
      <div className="tile rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9D98AA]">Codebase</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-tile-raised text-[#F5F3FF]">
            <i className="ri-code-box-line text-sm" />
          </div>
        </div>
        {projectStats.loading ? (
          <div className="space-y-1.5">
            <Skeleton width="50%" height="24px" />
            <Skeleton width="70%" height="12px" />
          </div>
        ) : (
          <>
            <div className="font-mono text-2xl font-bold tracking-tight text-[#F5F3FF] tabular-nums">
              {projectStats.totalFiles.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#9D98AA]">files</span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-[#6C667C] tabular-nums">
              {projectStats.totalLines.toLocaleString()} lines of code
            </p>
          </>
        )}
      </div>

      {/* 4. Collaborators */}
      <div className="tile rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9D98AA]">Collaborators</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-tile-raised text-accent">
            <i className="ri-team-line text-sm" />
          </div>
        </div>
        <div className="font-mono text-2xl font-bold tracking-tight text-[#F5F3FF] tabular-nums">
          {uniqueCollaborators.size}
        </div>
        <p className="mt-1 text-[11px] text-[#6C667C] tabular-nums">
          {uniqueCollaborators.size === 1 ? 'Peer collaborator' : 'Peer collaborators across projects'}
        </p>
      </div>
    </div>
  );
};

export default StatCards;
