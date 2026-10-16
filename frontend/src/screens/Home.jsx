import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import getErrorMessage from '../utils/getErrorMessage';

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

    axios
      .get('/projects/all')
      .then((res) => {
        if (!active) return;
        setProjects(res.data.projects || []);
        setFetchError('');
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch projects error:', err);
        setFetchError(getErrorMessage(err, 'Unable to load projects. Please verify your connection.'));
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
      setCreateError(getErrorMessage(error, 'Failed to create project.'));
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
    <div className="min-h-screen bg-slate-950 text-stone-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-500 font-mono text-sm font-bold text-slate-950">
              VF
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">Volaitile Friday</span>
              <span className="text-[11px] font-mono text-slate-400 block">Workspace</span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500 font-mono text-[10px] font-bold text-slate-950">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[160px] truncate font-medium text-slate-200">{user?.email || 'Logged in'}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 focus-ring"
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
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Projects & Workspaces
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Manage your engineering projects, team access, and shared rooms.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
          >
            <i className="ri-add-line text-base font-bold" />
            <span>New Project</span>
          </button>
        </div>

        {/* Search Bar & Summary */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <strong className="text-white font-mono">{projects.length}</strong>{' '}
              {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
            <span className="h-3 w-px bg-slate-800" />
            <span>
              <strong className="text-white font-mono">{totalCollaborators}</strong> Members
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {fetchError && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-200 animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <i className="ri-error-warning-line text-lg text-red-400 flex-shrink-0" />
              <p>{fetchError}</p>
            </div>
            <button
              type="button"
              onClick={refetchProjects}
              className="ml-4 rounded bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Projects Grid or Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 animate-skeleton"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-slate-800" />
                  <div className="h-4 w-12 rounded bg-slate-800" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded bg-slate-800" />
                <div className="mt-3 h-3 w-20 rounded bg-slate-800" />
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
                  onClick={() => navigate(`/project/${proj._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/project/${proj._id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open project ${proj.name}`}
                  className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 cursor-pointer focus-ring"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">Project</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400 border border-slate-700">
                        {collaboratorCount} {collaboratorCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <h2 className="mt-3 text-base font-semibold text-white truncate" title={proj.name}>
                      {proj.name}
                    </h2>

                    <p className="mt-1 font-mono text-[11px] text-slate-400 truncate">
                      ID: {proj._id}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-medium text-cyan-400">
                    <span>Open Workspace</span>
                    <i className="ri-arrow-right-line text-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center">
            <h3 className="text-base font-semibold text-white">
              {searchQuery ? 'No matching projects found' : 'No projects created yet'}
            </h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">
              {searchQuery
                ? `No projects matched "${searchQuery}". Clear your search or create a new project.`
                : 'Create your first project to begin collaborating with your team.'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 focus-ring"
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
                className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
              >
                <i className="ri-add-line text-sm font-bold" />
                <span>Create Project</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-lg animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 id="new-project-title" className="text-base font-bold text-white">Create New Project</h2>
                <p className="text-xs text-slate-400">Initialize a project workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {createError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200"
              >
                <i className="ri-error-warning-line text-base text-red-400 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{createError}</p>
              </div>
            )}

            <form onSubmit={createProject} className="mt-4 space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-xs font-medium text-slate-300">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  autoFocus
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. backend-services"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Must be unique. Collaborators can be added after creation.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !projectName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
                >
                  {isCreating ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
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
