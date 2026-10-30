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
  onlinePresenceMap = {},
  onNewProject,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');

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
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[rgba(255,255,255,0.35)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full tile-input rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-[#6C667C] focus-ring"
            aria-label="Search projects by name"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.35)] hover:text-white p-0.5"
              aria-label="Clear search input"
            >
              <i className="ri-close-line text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[rgba(255,255,255,0.35)]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="tile-input rounded-xl px-3 py-2 text-xs text-white focus-ring cursor-pointer"
            aria-label="Sort projects"
          >
            <option value="updated" className="bg-tile-deep">Recently updated</option>
            <option value="name" className="bg-tile-deep">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-primary-tint/40 p-4 text-xs text-primary">
          <span>{error}</span>
          {onRetry && (
            <Button variant="secondary" size="xs" onClick={onRetry}>Retry</Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
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
                className="tile group relative flex flex-col justify-between rounded-2xl p-5 cursor-pointer animate-fade-up"
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
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-tile-raised text-[rgba(255,255,255,0.55)] group-hover:text-primary transition-colors">
                        <i className="ri-folder-line text-sm" />
                      </div>
                      <h3 className="font-mono font-semibold text-xs sm:text-sm text-white truncate tracking-tight">
                        {proj.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onlineCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-mono text-[rgba(255,255,255,0.70)]"
                          title={`${onlineCount} collaborator online now`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          {onlineCount} online
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-tile-raised px-2 py-0.5 text-[10px] font-mono text-[rgba(255,255,255,0.55)]">
                        {isProjOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[rgba(255,255,255,0.35)] font-mono">
                    <span className="flex items-center gap-1">
                      <i className="ri-file-code-line text-xs" />
                      <span>{stats ? `${stats.filesCount} files` : '— files'}</span>
                    </span>
                    {stats?.totalLines > 0 && (
                      <span className="text-[11px] text-[rgba(255,255,255,0.55)]">
                        {stats.totalLines.toLocaleString()} LOC
                      </span>
                    )}
                  </div>

                  {/* Collaborator Avatars */}
                  <div className="mt-3.5 flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {displayMembers.map((member, mIdx) => {
                        const email = member?.email || 'User';
                        const initial = email.charAt(0).toUpperCase();
                        return (
                          <div
                            key={member?._id || mIdx}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-tile-raised font-mono text-[9px] font-bold text-white"
                            title={email}
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>
                    {extraCount > 0 && (
                      <span className="rounded-full bg-tile-raised border border-white/10 px-1.5 text-[10px] font-mono text-[rgba(255,255,255,0.35)]">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-xs">
                  <span className="text-[11px] font-mono text-[rgba(255,255,255,0.35)]">
                    {proj.createdAt
                      ? new Date(proj.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                      : 'Active'}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => { e.stopPropagation(); navigate(`/project/${proj._id}`); }}
                    iconRight={<i className="ri-arrow-right-line text-xs" />}
                    className="text-[rgba(255,255,255,0.55)] hover:text-white font-mono"
                  >
                    Open
                  </Button>
                </div>
              </div>
            );
          })}

          {/* New Project ghost tile */}
          <button
            type="button"
            onClick={onNewProject}
            className="tile-ghost rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] cursor-pointer focus-ring"
            aria-label="Create new project"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-dashed border-white/20 text-[rgba(255,255,255,0.35)]">
              <i className="ri-add-line text-lg" />
            </div>
            <span className="text-xs font-mono text-[rgba(255,255,255,0.35)]">New project</span>
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="tile-ghost rounded-2xl flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tile-raised text-primary mb-3">
            <i className="ri-folder-add-line text-xl" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            {searchQuery ? 'No matching projects found' : 'No projects yet'}
          </h4>
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.55)] max-w-sm">
            {searchQuery
              ? `No project matches "${searchQuery}". Clear your search to view all workspaces.`
              : 'Create your first collaborative developer project to start coding and chatting.'}
          </p>
          <div className="mt-4">
            {searchQuery ? (
              <Button variant="secondary" size="xs" onClick={() => setSearchQuery('')}>Clear search</Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onNewProject} icon={<i className="ri-add-line text-sm" />}>
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
