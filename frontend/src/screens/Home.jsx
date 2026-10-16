import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const Home = () => {
  const { user, logout } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [createError, setCreateError] = useState('');
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    axios.get('/projects/all')
      .then((res) => {
        if (!active) return;
        setProjects(res.data.projects || []);
        setFetchError('');
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch projects error:', err);
        setFetchError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Unable to load projects. Please verify your connection.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const refetchProjects = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const createProject = async (e) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) return;

    try {
      setIsCreating(true);
      setCreateError('');
      await axios.post('/projects/create', { name: trimmed });
      setProjectName('');
      setIsModalOpen(false);
      refetchProjects();
    } catch (error) {
      console.error('Create project error:', error);
      const data = error?.response?.data;
      const msg = data?.error || (data?.errors && data.errors[0]?.msg) || 'Failed to create project.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => p.name?.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const totalCollaborators = useMemo(() => {
    const setOfUsers = new Set();
    projects.forEach((p) => {
      if (Array.isArray(p.users)) {
        p.users.forEach((u) => setOfUsers.add(typeof u === 'string' ? u : u._id));
      }
    });
    return setOfUsers.size;
  }, [projects]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_50%),linear-gradient(180deg,_#030712_0%,_#090d16_50%,_#070a12_100%)] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/25">
              <i className="ri-flashlight-fill text-xl text-slate-950" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white block">Volaitile Friday</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 block -mt-1">Workspace Studio</span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-bold text-slate-950">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate font-medium text-slate-200">{user?.email || 'Logged in'}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-ring"
              title="Sign out of account"
              aria-label="Sign out"
            >
              <i className="ri-logout-box-r-line text-sm" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Projects & Workspaces
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Manage your collaborative engineering rooms, invite team members, and start real-time sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-300 active:scale-[0.98] focus-ring"
          >
            <i className="ri-add-line text-lg font-bold" />
            <span>New Project</span>
          </button>
        </div>

        {/* Quick Stats & Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <i className="ri-search-line text-base" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                <i className="ri-close-circle-fill text-sm" />
              </button>
            )}
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <i className="ri-folder-6-line text-cyan-400" />
              <strong className="text-white font-mono">{projects.length}</strong> {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
            <span className="h-3 w-px bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <i className="ri-team-line text-indigo-400" />
              <strong className="text-white font-mono">{totalCollaborators}</strong> Active Members
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {fetchError && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200 animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <i className="ri-error-warning-fill text-xl text-red-400 flex-shrink-0" />
              <p>{fetchError}</p>
            </div>
            <button
              type="button"
              onClick={refetchProjects}
              className="ml-4 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Projects Grid or Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 shadow-lg animate-skeleton"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-slate-800" />
                  <div className="h-4 w-12 rounded-md bg-slate-800" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded-md bg-slate-800" />
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-3 w-4 rounded-full bg-slate-800" />
                  <div className="h-3 w-24 rounded-md bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((proj) => {
              const collaboratorCount = Array.isArray(proj.users) ? proj.users.length : 0;
              return (
                <div
                  key={proj._id}
                  onClick={() => navigate('/project', { state: { project: proj } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/project', { state: { project: proj } });
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open project ${proj.name}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/30 cursor-pointer focus-ring"
                >
                  <div>
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-950 to-slate-800 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/40 group-hover:from-cyan-900/60 transition-colors">
                        <i className="ri-terminal-box-line text-xl" />
                      </div>
                      <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-400 border border-white/5">
                        {collaboratorCount} {collaboratorCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    {/* Project Name */}
                    <h2 className="mt-4 text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate" title={proj.name}>
                      {proj.name}
                    </h2>

                    {/* Metadata */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <i className="ri-team-line text-cyan-400/80" />
                      <span>{collaboratorCount} Collaborators linked</span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-xs font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span>Open Workspace</span>
                    <i className="ri-arrow-right-line text-base transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 sm:p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-cyan-400 border border-white/10 shadow-lg">
              <i className="ri-folder-add-line text-3xl" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">
              {searchQuery ? 'No matching projects found' : 'No projects created yet'}
            </h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">
              {searchQuery
                ? `No projects matched your search for "${searchQuery}". Clear your search or create a new project.`
                : 'Create your first collaborative developer room to begin coding and communicating with your team.'}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 focus-ring"
                >
                  Clear filter
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCreateError('');
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
              >
                <i className="ri-add-line text-base" />
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/50 animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <i className="ri-folder-add-line text-lg" />
                </div>
                <div>
                  <h2 id="new-project-title" className="text-lg font-bold text-white">Create New Project</h2>
                  <p className="text-xs text-slate-400">Initialize a collaborative workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {createError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"
              >
                <i className="ri-error-warning-fill text-base text-red-400 mt-0.5" />
                <p className="flex-1">{createError}</p>
              </div>
            )}

            <form onSubmit={createProject} className="mt-5 space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-xs font-medium text-slate-300">
                  Project Name
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <i className="ri-terminal-line text-base" />
                  </div>
                  <input
                    id="projectName"
                    type="text"
                    autoFocus
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="e.g. cloud-orchestrator"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Must be unique. Collaborators can be added after creation.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !projectName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
                >
                  {isCreating ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line text-sm font-bold" />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
