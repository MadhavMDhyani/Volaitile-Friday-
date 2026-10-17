import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import { ProjectCardSkeleton } from '../Skeleton';

export const ProjectGrid = ({
  projects = [],
  loading = false,
  error = '',
  currentUserId,
  statsMap = {},
  onlinePresenceMap = {}, // Map of projectId -> onlineCount
  onNewProject,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'name'

  const navigate = useNavigate();

  const isOwner = (project) => {
    if (!project || !currentUserId) return false;
    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    return ownerId === currentUserId;
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name?.toLowerCase().includes(q));
    }

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default: recently updated or created
      result.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-md border border-[#262626] bg-[#111111] pl-8 pr-8 py-1.5 text-xs text-[#fafafa] placeholder-[#737373] focus-ring transition-colors"
            aria-label="Search projects by name"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#fafafa] p-0.5"
              aria-label="Clear search input"
            >
              <i className="ri-close-line text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#737373]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-[#262626] bg-[#111111] px-2.5 py-1.5 text-xs text-[#fafafa] focus-ring cursor-pointer"
            aria-label="Sort projects"
          >
            <option value="updated">Recently updated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <span>{error}</span>
          {onRetry && (
            <Button variant="secondary" size="xs" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((proj, idx) => {
            const isProjOwner = isOwner(proj);
            const stats = statsMap[proj._id];
            const onlineCount = onlinePresenceMap[proj._id] || 0;
            const members = Array.isArray(proj.users) ? proj.users : [];
            const displayMembers = members.slice(0, 3);
            const extraCount = Math.max(0, members.length - 3);

            return (
              <div
                key={proj._id}
                onClick={() => navigate(`/project/${proj._id}`)}
                className="group relative flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-4 cursor-pointer transition-all duration-150 ease-out hover:border-[#404040] focus-ring animate-fade-up"
                style={{
                  animationDelay: `${Math.min(idx, 6) * 35}ms`,
                  animationFillMode: 'both',
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/project/${proj._id}`);
                  }
                }}
                aria-label={`Open project ${proj.name}`}
              >
                <div>
                  {/* Card Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#262626] bg-[#171717] text-[#a3a3a3] group-hover:text-[#fafafa] transition-colors">
                        <i className="ri-folder-line text-sm" />
                      </div>
                      <h3 className="font-mono font-semibold text-xs sm:text-sm text-[#fafafa] truncate tracking-tight">
                        {proj.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Online dot indicator if active */}
                      {onlineCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400"
                          title={`${onlineCount} collaborator online now`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {onlineCount} online
                        </span>
                      )}

                      {/* Owner vs Member Badge */}
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono ${
                          isProjOwner
                            ? 'border-[#404040] bg-[#171717] text-[#fafafa]'
                            : 'border-[#262626] bg-[#0a0a0a] text-[#737373]'
                        }`}
                      >
                        {isProjOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row: Files & Lines */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#737373] font-mono">
                    <span className="flex items-center gap-1">
                      <i className="ri-file-code-line text-xs" />
                      <span>{stats ? `${stats.filesCount} files` : '— files'}</span>
                    </span>
                    {stats?.totalLines > 0 && (
                      <span className="text-[11px] text-[#525252]">
                        {stats.totalLines.toLocaleString()} LOC
                      </span>
                    )}
                  </div>

                  {/* Collaborator Avatars */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {displayMembers.map((member, mIdx) => {
                        const email = member?.email || 'User';
                        const initial = email.charAt(0).toUpperCase();
                        return (
                          <div
                            key={member?._id || mIdx}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-[#111111] bg-[#262626] font-mono text-[9px] font-bold text-[#fafafa]"
                            title={email}
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>

                    {extraCount > 0 && (
                      <span className="rounded bg-[#171717] px-1 py-0.5 text-[10px] font-mono text-[#737373]">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Open Button */}
                <div className="mt-4 flex items-center justify-between border-t border-[#262626] pt-2.5 text-xs">
                  <span className="text-[11px] font-mono text-[#525252]">
                    {proj.createdAt
                      ? new Date(proj.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Active'}
                  </span>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/project/${proj._id}`);
                    }}
                    iconRight={<i className="ri-arrow-right-line text-xs" />}
                    className="text-[#a3a3a3] hover:text-[#fafafa] font-mono"
                  >
                    Open
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#262626] bg-[#111111]/40 py-12 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#a3a3a3] mb-3">
            <i className="ri-folder-add-line text-xl" />
          </div>
          <h4 className="text-sm font-semibold text-[#fafafa]">
            {searchQuery ? 'No matching projects found' : 'No projects yet'}
          </h4>
          <p className="mt-1 text-xs text-[#a3a3a3] max-w-sm">
            {searchQuery
              ? `No project matches "${searchQuery}". Clear your search query to view all workspaces.`
              : 'Create your first collaborative developer project to start coding and chatting.'}
          </p>
          <div className="mt-4">
            {searchQuery ? (
              <Button variant="secondary" size="xs" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onNewProject}
                icon={<i className="ri-add-line text-sm" />}
              >
                Create your first project
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGrid;
