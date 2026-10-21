import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import getErrorMessage from '../utils/getErrorMessage';
import Logo from '../components/Logo';
import AccountMenu from '../components/AccountMenu';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../context/useToast';
import SystemStatusChip from '../components/dashboard/SystemStatusChip';
import StatCards from '../components/dashboard/StatCards';
import ProjectGrid from '../components/dashboard/ProjectGrid';
import RecentActivity from '../components/dashboard/RecentActivity';
import AiQuickAsk from '../components/dashboard/AiQuickAsk';

export const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [statsMap, setStatsMap] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Create Project Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const statsFetchedRef = useRef(false);

  // Fetch project list
  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      setProjectError('');
      const res = await axios.get('/projects/all');
      const loaded = res.data?.projects || [];
      setProjects(loaded);
      return loaded;
    } catch (err) {
      console.error('Fetch dashboard projects error:', err);
      setProjectError(getErrorMessage(err, 'Failed to retrieve workspaces.'));
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Fetch individual project stats with capped concurrency (max 3 at a time)
  const fetchAggregatedStats = useCallback(async (projectList) => {
    if (!projectList || projectList.length === 0) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    try {
      // Concurrency capped worker queue (chunk size = 3)
      const concurrency = 3;
      const resultsMap = {};

      for (let i = 0; i < projectList.length; i += concurrency) {
        const chunk = projectList.slice(i, i + concurrency);
        const settled = await Promise.allSettled(
          chunk.map((p) => axios.get(`/tools/project-stats/${p._id}`))
        );

        settled.forEach((res, idx) => {
          const p = chunk[idx];
          if (res.status === 'fulfilled' && res.value?.data?.stats) {
            resultsMap[p._id] = res.value.data.stats;
          }
        });
      }

      setStatsMap(resultsMap);
    } catch (err) {
      console.warn('Aggregated stats warning:', err?.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;

    axios
      .get('/projects/all')
      .then((res) => {
        if (!active) return;
        const loaded = res.data?.projects || [];
        setProjects(loaded);
        setProjectError('');
        if (!statsFetchedRef.current && loaded.length > 0) {
          statsFetchedRef.current = true;
          fetchAggregatedStats(loaded);
        } else {
          setStatsLoading(false);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch dashboard projects error:', err);
        setProjectError(getErrorMessage(err, 'Failed to retrieve workspaces.'));
        setStatsLoading(false);
      })
      .finally(() => {
        if (active) {
          setLoadingProjects(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchAggregatedStats]);

  // Aggregate lines of code and files across all fetched stats
  const aggregateMetrics = Object.values(statsMap).reduce(
    (acc, cur) => {
      acc.totalFiles += cur.filesCount || 0;
      acc.totalLines += cur.totalLines || 0;
      return acc;
    },
    { totalFiles: 0, totalLines: 0 }
  );

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
      if (created?._id) {
        navigate(`/project/${created._id}`);
      } else {
        fetchProjects();
      }
    } catch (err) {
      console.error('Create project error:', err);
      if (err.response?.status === 409) {
        setCreateError(err.response?.data?.error || 'A project with this name already exists.');
      } else {
        setCreateError(getErrorMessage(err, 'Failed to create project workspace.'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Derive friendly user display name or email prefix
  const userGreeting = user?.name || (user?.email ? user.email.split('@')[0] : 'Developer');

  return (
    <div className="min-h-screen bg-transparent text-[#fafafa] flex flex-col font-sans selection:bg-[#fafafa] selection:text-[#000000]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#000000]/75 backdrop-blur-[var(--blur)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo size="md" to="/dashboard" />
            <nav className="hidden sm:flex items-center gap-4 text-xs font-medium" aria-label="Main Navigation">
              <Link
                to="/dashboard"
                className="text-[#fafafa] border-b-2 border-white pb-0.5 transition-colors"
                aria-current="page"
              >
                Dashboard
              </Link>
              <Link
                to="/"
                className="text-[#a3a3a3] hover:text-[#fafafa] transition-colors"
              >
                Projects
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <SystemStatusChip />
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
        {/* Welcome Banner & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fafafa]">
                Welcome back, {userGreeting}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#a3a3a3]">
              Workspace overview, code intelligence metrics, and live collaborator activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreateError('');
                setProjectName('');
                setIsModalOpen(true);
              }}
              icon={<i className="ri-add-line text-sm" />}
            >
              New project
            </Button>
          </div>
        </div>

        {/* 1. Stat Cards Row */}
        <section aria-label="Workspace metrics summary">
          <StatCards
            projects={projects}
            loadingProjects={loadingProjects}
            projectStats={{
              totalFiles: aggregateMetrics.totalFiles,
              totalLines: aggregateMetrics.totalLines,
              loading: statsLoading,
            }}
            currentUserId={user?._id?.toString() || ''}
            error={projectError}
            onRetry={fetchProjects}
          />
        </section>

        {/* 2. Main Two-Column Layout (Projects Grid + Sidebar Activity / AI) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Projects Grid (2 cols) */}
          <section className="lg:col-span-2 space-y-4" aria-label="Projects grid">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-[#fafafa]">
                  Your Workspaces
                </h2>
                <p className="text-[11px] text-[#737373]">
                  Select a project to start coding, editing files, or chatting.
                </p>
              </div>

              <Link
                to="/"
                className="text-xs text-[#a3a3a3] hover:text-[#fafafa] flex items-center gap-1 transition-colors font-mono"
              >
                <span>View all</span>
                <i className="ri-arrow-right-line text-xs" />
              </Link>
            </div>

            <ProjectGrid
              projects={projects}
              loading={loadingProjects}
              error={projectError}
              currentUserId={user?._id?.toString() || ''}
              statsMap={statsMap}
              onNewProject={() => {
                setCreateError('');
                setProjectName('');
                setIsModalOpen(true);
              }}
              onRetry={fetchProjects}
            />
          </section>

          {/* Right Column: Recent Activity & Friday AI Quick Ask (1 col) */}
          <section className="space-y-6" aria-label="Live activity and Friday AI">
            {/* Recent Activity Panel */}
            <RecentActivity />

            {/* Friday AI Quick Ask */}
            <AiQuickAsk />
          </section>
        </div>
      </main>

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label
              htmlFor="dashboard-project-name"
              className="block text-xs font-medium text-[#a3a3a3] mb-1.5"
            >
              Project Name <span className="text-accent">*</span>
            </label>
            <input
              id="dashboard-project-name"
              type="text"
              required
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setCreateError('');
              }}
              placeholder="e.g. backend-microservice, my-awesome-app"
              className="w-full glass-input px-3.5 py-2.5 text-xs text-[#fafafa] placeholder-[#737373] focus-ring transition-colors font-mono"
              maxLength={50}
              autoFocus
              disabled={isCreating}
            />
            {createError ? (
              <p className="mt-1.5 text-xs text-accent font-medium">{createError}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[#737373]">
                Names must be unique to your account. Standard seed files will be created automatically.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!projectName.trim() || isCreating}
              loading={isCreating}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
