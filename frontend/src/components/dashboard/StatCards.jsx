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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 h-28"
          >
            <div className="flex items-center justify-between">
              <Skeleton width="45%" height="14px" />
              <Skeleton width="28px" height="28px" rounded="rounded-md" />
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
      <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
        <div className="flex items-center gap-2">
          <i className="ri-error-warning-line text-base" />
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

  // Calculate stats
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Projects */}
      <div className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#404040]">
        <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
          <span className="font-medium">Total Projects</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#fafafa]">
            <i className="ri-folder-3-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-[#fafafa]">
            {totalProjects}
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">
            Active developer workspaces
          </p>
        </div>
      </div>

      {/* 2. Projects Ownership (Owned vs Shared) */}
      <div className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#404040]">
        <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
          <span className="font-medium">Ownership</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#fafafa]">
            <i className="ri-shield-user-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#fafafa]">
              {ownedCount}
            </span>
            <span className="text-xs font-mono text-[#737373]">/ {totalProjects} owned</span>
          </div>

          {/* Simple CSS ownership ratio bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
            <div
              className="h-full bg-[#fafafa] transition-all duration-300"
              style={{ width: `${ownedPercent}%` }}
              title={`${ownedCount} owned (${ownedPercent}%)`}
            />
          </div>

          <p className="mt-1.5 text-[11px] text-[#737373]">
            {ownedCount} owned · {memberCount} shared
          </p>
        </div>
      </div>

      {/* 3. Files & Lines of Code */}
      <div className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#404040]">
        <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
          <span className="font-medium">Total Codebase</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#fafafa]">
            <i className="ri-code-box-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          {projectStats.loading ? (
            <div className="space-y-1.5">
              <Skeleton width="50%" height="24px" />
              <Skeleton width="70%" height="12px" />
            </div>
          ) : (
            <>
              <div className="font-mono text-2xl font-bold tracking-tight text-[#fafafa]">
                {projectStats.totalFiles.toLocaleString()}{' '}
                <span className="text-sm font-normal text-[#a3a3a3]">files</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#737373]">
                {projectStats.totalLines.toLocaleString()} lines of code
              </p>
            </>
          )}
        </div>
      </div>

      {/* 4. Collaborators */}
      <div className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#404040]">
        <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
          <span className="font-medium">Collaborators</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#fafafa]">
            <i className="ri-team-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-[#fafafa]">
            {uniqueCollaborators.size}
          </div>
          <p className="mt-1 text-[11px] text-[#737373]">
            {uniqueCollaborators.size === 1 ? 'Peer collaborator' : 'Peer collaborators across projects'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
