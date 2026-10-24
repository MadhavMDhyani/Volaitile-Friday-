import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import getErrorMessage from '../utils/getErrorMessage';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Logo from '../components/Logo';
import AccountMenu from '../components/AccountMenu';
import { ProjectCardSkeleton } from '../components/Skeleton';
import { useToast } from '../context/useToast';

export const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [createError, setCreateError] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [animatingOutId, setAnimatingOutId] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await axios.get('/projects/all');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Fetch projects error:', err);
      setFetchError(getErrorMessage(err, 'Unable to load projects.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    axios
      .get('/projects/all')
      .then((res) => {
        if (!ignore) {
          setProjects(res.data.projects || []);
          setFetchError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Fetch projects error:', err);
          setFetchError(getErrorMessage(err, 'Unable to load projects.'));
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) return;

    try {
      setIsCreating(true);
      setCreateError('');
      const res = await axios.post('/projects/create', { name: trimmed });
      toast.success(`Project "${trimmed}" created successfully`);
      setProjectName('');
      setIsModalOpen(false);
      const created = res.data?.project;
      if (created) {
        setProjects((prev) => [created, ...prev]);
      } else {
        fetchProjects();
      }
    } catch (error) {
      console.error('Create project error:', error);
      // Inline 409 duplicate name handling
      if (error.response?.status === 409) {
        setCreateError(error.response?.data?.error || 'You already have a project with this name');
      } else {
        setCreateError(getErrorMessage(error, 'Failed to create project'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProjectId) return;
    try {
      setIsDeleting(true);
      await axios.delete(`/projects/${deletingProjectId}`);
      toast.success('Project and associated files deleted');
      setAnimatingOutId(deletingProjectId);
      setTimeout(() => {
        setProjects((prev) => prev.filter((p) => p._id !== deletingProjectId));
        setDeletingProjectId(null);
        setAnimatingOutId(null);
      }, 150);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete project'));
    } finally {
      setIsDeleting(false);
    }
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name?.toLowerCase().includes(q));
    }

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  const isOwner = (project) => {
    if (!project || !user?._id) return false;
    const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
    return ownerId === user._id.toString();
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f3e6da] flex flex-col font-sans selection:bg-[#f3e6da] selection:text-[#0f0a07]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0a07]/75 backdrop-blur-[var(--blur)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo size="md" to="/dashboard" />
            <nav className="hidden sm:flex items-center gap-4 text-xs font-medium" aria-label="Main Navigation">
              <Link
                to="/dashboard"
                className="text-[#a89384] hover:text-[#f3e6da] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/"
                className="text-[#f3e6da] border-b-2 border-white pb-0.5 transition-colors"
                aria-current="page"
              >
                Projects
              </Link>
            </nav>
          </div>
          <AccountMenu />
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Title & Actions Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3e6da]">
              Projects
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#a89384]">
              Cloud developer workspaces with collaborative editing and Friday AI.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError('');
              setProjectName('');
              setIsModalOpen(true);
            }}
            icon={<i className="ri-add-line text-base" />}
          >
            New Project
          </Button>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6e5d50]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full glass-input pl-9 pr-8 py-2 text-xs text-[#f3e6da] placeholder-[#6e5d50] focus-ring transition-colors"
              aria-label="Search projects by name"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e5d50] hover:text-[#f3e6da] p-0.5"
                aria-label="Clear search"
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
              <option value="newest" className="bg-[#0f0a07]">Newest first</option>
              <option value="name" className="bg-[#0f0a07]">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Fetch Error Display */}
        {fetchError && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-accent-deep bg-accent-tint/40 p-3 text-xs text-accent">
            <span>{fetchError}</span>
            <Button variant="secondary" size="xs" onClick={fetchProjects}>
              Retry
            </Button>
          </div>
        )}

        {/* Project Grid / Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : processedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processedProjects.map((proj, index) => {
              const isProjOwner = isOwner(proj);
              const isRemoving = animatingOutId === proj._id;

              return (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/project/${proj._id}`, { viewTransition: true })}
                  style={{
                    animationDelay: `${Math.min(index, 8) * 40}ms`,
                    animationFillMode: 'both',
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl glass p-5 cursor-pointer transition-[border-color,transform] duration-180 ease-out hover:border-white/25 hover:-translate-y-0.5 animate-fade-up ${
                    isRemoving ? 'opacity-0 scale-95 transition-[opacity,transform] duration-150' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/project/${proj._id}`, { viewTransition: true });
                    }
                  }}
                  aria-label={`Open project ${proj.name}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <i className="ri-folder-line text-[#a89384] text-base group-hover:text-accent transition-colors" />
                        <h2 className="font-semibold text-sm tracking-tight text-[#f3e6da] truncate font-mono">
                          {proj.name}
                        </h2>
                      </div>

                      {isProjOwner && (
                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-[#a89384]">
                          Owner
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-[#6e5d50]">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-group-line text-xs" />
                        <span>{proj.users?.length || 1} member{proj.users?.length !== 1 ? 's' : ''}</span>
                      </span>
                      {proj.createdAt && (
                        <span className="font-mono text-[11px]">
                          {new Date(proj.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-[#a89384] group-hover:text-[#f3e6da] transition-colors">
                      Open workspace
                      <i className="ri-arrow-right-line text-xs transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>

                    {isProjOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProjectId(proj._id);
                        }}
                        className="text-[#6e5d50] hover:text-accent p-1 rounded-md hover:bg-white/10 focus-ring transition-colors"
                        title="Delete project"
                        aria-label={`Delete project ${proj.name}`}
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 glass py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass text-[#a89384] mb-4">
              <i className="ri-folder-add-line text-2xl text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-[#f3e6da]">
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-xs text-[#a89384] max-w-sm">
              {searchQuery
                ? `No projects matched "${searchQuery}". Try a different search query.`
                : 'Get started by creating your first project workspace with automatic seed files.'}
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCreateError('');
                  setProjectName('');
                  setIsModalOpen(true);
                }}
              >
                Create Project
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {createError && (
            <div className="rounded-lg border border-accent-deep bg-accent-tint/40 p-2.5 text-xs text-accent">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a89384] mb-1.5" htmlFor="new-proj-name">
              Project Name
            </label>
            <input
              id="new-proj-name"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setCreateError('');
              }}
              placeholder="e.g. backend-api or auth-service"
              className="w-full glass-input px-3.5 py-2.5 text-xs text-[#f3e6da] placeholder-[#6e5d50] focus-ring transition-colors font-mono"
              autoFocus
              required
            />
            <p className="mt-1.5 text-[11px] text-[#6e5d50]">
              Starter files (README.md, index.js, package.json) will be seeded automatically.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isCreating}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingProjectId)}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="Are you sure you want to permanently delete this project? This will erase all project files, chat history, and member associations."
        confirmText="Delete Project"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default Home;
