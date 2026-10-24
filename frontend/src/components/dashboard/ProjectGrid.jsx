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
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6e5d50]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full glass-input pl-8 pr-8 py-2 text-xs text-[#f3e6da] placeholder-[#6e5d50] focus-ring transition-colors"
            aria-label="Search projects by name"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e5d50] hover:text-[#f3e6da] p-0.5"
              aria-label="Clear search input"
            >
              <i className="ri-close-line text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#6e5d50]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-3 py-2 text-xs text-[#f3e6da] focus-ring cursor-pointer"
            aria-label="Sort projects"
          >
            <option value="updated" className="bg-[#0f0a07]">Recently updated</option>
            <option value="name" className="bg-[#0f0a07]">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-accent-deep bg-accent-tint/40 p-4 text-xs text-accent">
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
                onClick={() => navigate(`/project/${proj._id}`, { viewTransition: true })}
                className="group relative flex flex-col justify-between rounded-2xl glass p-4.5 cursor-pointer transition-[border-color,transform] duration-180 ease-out hover:border-white/25 hover:-translate-y-0.5 focus-ring animate-fade-up"
                style={{
                  animationDelay: `${Math.min(idx, 11) * 40}ms`,
                  animationFillMode: 'both',
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/project/${proj._id}`, { viewTransition: true });
                  }
                }}
                aria-label={`Open project ${proj.name}`}
              >
                <div>
                  {/* Card Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl glass text-[#a89384] group-hover:text-accent transition-colors">
                        <i className="ri-folder-line text-sm" />
                      </div>
                      <h3 className="font-mono font-semibold text-xs sm:text-sm text-[#f3e6da] truncate tracking-tight">
                        {proj.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Online dot indicator if active */}
                      {onlineCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-mono text-[#c4b5a8]"
                          title={`${onlineCount} collaborator online now`}
                        >
                          <span className="presence-dot h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                          {onlineCount} online
                        </span>
                      )}

                      {/* Owner vs Member Badge */}
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono border-white/15 bg-white/[0.06] text-[#a89384]"
                      >
                        {isProjOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row: Files & Lines */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#6e5d50] font-mono">
                    <span className="flex items-center gap-1">
                      <i className="ri-file-code-line text-xs" />
                      <span>{stats ? `${stats.filesCount} files` : '— files'}</span>
                    </span>
                    {stats?.totalLines > 0 && (
                      <span className="text-[11px] text-[#a89384]">
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
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/[0.1] font-mono text-[9px] font-bold text-[#f3e6da]"
                            title={email}
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>

                    {extraCount > 0 && (
                      <span className="rounded-full bg-white/[0.06] border border-white/10 px-1.5 py-0.2 text-[10px] font-mono text-[#6e5d50]">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Open Button */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                  <span className="text-[11px] font-mono text-[#6e5d50]">
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
                      navigate(`/project/${proj._id}`, { viewTransition: true });
                    }}
                    iconRight={<i className="ri-arrow-right-line text-xs" />}
                    className="text-[#a89384] hover:text-[#f3e6da] font-mono"
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 glass py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass text-[#a89384] mb-3">
            <i className="ri-folder-add-line text-xl text-accent" />
          </div>
          <h4 className="text-sm font-semibold text-[#f3e6da]">
            {searchQuery ? 'No matching projects found' : 'No projects yet'}
          </h4>
          <p className="mt-1 text-xs text-[#a89384] max-w-sm">
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
