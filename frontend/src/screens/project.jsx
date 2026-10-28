import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useContext, useCallback } from 'react';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import getErrorMessage from '../utils/getErrorMessage';
import ProjectHeader from './project/ProjectHeader';
import FilesPanel from './project/FilesPanel';
import ChatPanel from './project/ChatPanel';
import MembersDrawer from './project/MembersDrawer';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import useProjectSocket from '../hooks/useProjectSocket';

export const Project = () => {
  const { projectId } = useParams();
  const { user } = useContext(UserContext);

  const [project, setProject] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('loading'); // 'loading' | 'success' | 'forbidden' | 'notfound' | 'error'
  const [fetchErrorMsg, setFetchErrorMsg] = useState('');
  const [isMembersDrawerOpen, setIsMembersDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vf_project_tab');
      if (saved === 'files' || saved === 'editor' || saved === 'chat') return saved;
    }
    return 'editor';
  });

  const handleTabChange = useCallback((tab) => {
    setMobileTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_project_tab', tab);
    }
  }, []);

  // Connect socket only once project has loaded successfully
  const socketControls = useProjectSocket(fetchStatus === 'success' ? projectId : null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setFetchStatus('loading');
      setFetchErrorMsg('');
      const res = await axios.get(`/projects/get-project/${projectId}`);
      const loaded = res.data?.project;
      if (!loaded) {
        setFetchStatus('notfound');
        return;
      }
      setProject(loaded);
      setFetchStatus('success');
    } catch (err) {
      console.error('Fetch project error:', err);
      const status = err.response?.status;
      if (status === 403) {
        setFetchStatus('forbidden');
      } else if (status === 404 || status === 400) {
        setFetchStatus('notfound');
      } else {
        setFetchStatus('error');
        setFetchErrorMsg(getErrorMessage(err, 'Failed to load project'));
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    let ignore = false;
    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        if (ignore) return;
        const loaded = res.data?.project;
        if (!loaded) {
          setFetchStatus('notfound');
          return;
        }
        setProject(loaded);
        setFetchStatus('success');
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Fetch project error:', err);
        const status = err.response?.status;
        if (status === 403) {
          setFetchStatus('forbidden');
        } else if (status === 404 || status === 400) {
          setFetchStatus('notfound');
        } else {
          setFetchStatus('error');
          setFetchErrorMsg(getErrorMessage(err, 'Failed to load project'));
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectId]);

  const handleUpdateMembers = (updatedUsers) => {
    setProject((prev) => (prev ? { ...prev, users: updatedUsers } : prev));
  };

  const isOwner = Boolean(
    project &&
      user?._id &&
      (project.owner?._id ? project.owner._id.toString() : project.owner?.toString()) ===
        user._id.toString()
  );

  // Loading State with Skeletons
  if (fetchStatus === 'loading') {
    return (
      <div className="flex h-screen w-full flex-col bg-[#110B20]/85 backdrop-blur-sm text-[#F5F3FF] font-sans">
        {/* Header Skeleton */}
        <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#110B20]/80 backdrop-blur-md px-4">
          <div className="flex items-center gap-3">
            <Skeleton width="28px" height="28px" rounded="rounded-lg" />
            <Skeleton width="150px" height="18px" />
          </div>
          <Skeleton width="96px" height="28px" rounded="rounded-lg" />
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-white/[0.08] bg-[#110B20]/70 backdrop-blur-md p-3 space-y-2">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="100%" height="28px" rounded="rounded-lg" />
            <Skeleton width="100%" height="28px" rounded="rounded-lg" />
            <Skeleton width="100%" height="28px" rounded="rounded-lg" />
          </div>
          <div className="flex-1 bg-[#110B20]/80 p-4">
            <Skeleton width="100%" height="100%" rounded="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 403 Forbidden State: User does not have access
  if (fetchStatus === 'forbidden') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#110B20]/85 backdrop-blur-sm px-4 text-center text-[#F5F3FF] font-sans">
        <div className="glass-liquid max-w-md w-full p-8 rounded-3xl border-glass-border/60 shadow-glass flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-deep bg-accent-tint/20 text-accent mb-4 shadow-[0_0_24px_rgb(var(--accent-rgb)/0.25)]">
            <i className="ri-lock-line text-2xl" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F3FF]">
            Access Denied
          </h1>
          <p className="mt-2 text-xs text-[#9D98AA] leading-relaxed">
            You do not have access to this project. Ask the project owner to add you as a collaborator.
          </p>
          <Link to="/" className="mt-6">
            <Button variant="primary" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 404 Not Found State
  if (fetchStatus === 'notfound') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#110B20]/85 backdrop-blur-sm px-4 text-center text-[#F5F3FF] font-sans">
        <div className="glass-liquid max-w-md w-full p-8 rounded-3xl border-glass-border/60 shadow-glass flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-[#9D98AA] mb-4 shadow-glass">
            <i className="ri-folder-warning-line text-2xl text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F3FF]">
            Project Not Found
          </h1>
          <p className="mt-2 text-xs text-[#9D98AA] leading-relaxed">
            The requested project workspace does not exist or may have been deleted.
          </p>
          <Link to="/" className="mt-6">
            <Button variant="primary" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (fetchStatus === 'error') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#110B20]/85 backdrop-blur-sm px-4 text-center text-[#F5F3FF] font-sans">
        <div className="glass-liquid max-w-md w-full p-8 rounded-3xl border-glass-border/60 shadow-glass flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-deep bg-accent-tint/20 text-accent mb-4 shadow-[0_0_24px_rgb(var(--accent-rgb)/0.25)]">
            <i className="ri-error-warning-line text-2xl" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F3FF]">
            Unable to Load Workspace
          </h1>
          <p className="mt-2 text-xs text-[#9D98AA] leading-relaxed">
            {fetchErrorMsg || 'A network error occurred while retrieving project details.'}
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" size="sm" onClick={fetchProject}>
              Retry
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#110B20]/80 text-[#F5F3FF] font-sans overflow-hidden">
      {/* Top Navigation */}
      <ProjectHeader
        project={project}
        isOwner={isOwner}
        onOpenMembers={() => setIsMembersDrawerOpen(true)}
      />

      {/* Main Workspace Split Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Files & Editor section */}
        <section
          className={`flex-1 flex flex-col min-w-0 border-r border-white/[0.08] ${
            mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
          aria-label="File management and code editor"
        >
          <FilesPanel
            projectId={projectId}
            mobileView={mobileTab}
            onSelectFile={() => handleTabChange('editor')}
          />
        </section>

        {/* Chat & AI Panel */}
        <section
          className={`w-full lg:w-[440px] shrink-0 flex flex-col border-l border-white/[0.08] bg-[#18102B]/50 backdrop-blur-xl ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
          aria-label="Team chat and Friday AI assistant"
        >
          <ChatPanel
            projectId={projectId}
            currentUserId={user?._id?.toString() || ''}
            socketControls={socketControls}
          />
        </section>
      </div>

      {/* Bottom Tab Bar (below 1024px, >= 48px height, safe-area aware) */}
      <nav
        className="lg:hidden flex items-center justify-around border-t border-white/[0.08] bg-[#18102B]/95 backdrop-blur-xl shrink-0 min-h-[48px] h-14 pb-[env(safe-area-inset-bottom,0px)] z-30 select-none"
        aria-label="Project view navigation"
      >
        <button
          type="button"
          onClick={() => handleTabChange('files')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
            mobileTab === 'files'
              ? 'text-accent font-semibold'
              : 'text-[#9D98AA] hover:text-[#F5F3FF]'
          }`}
        >
          <i className="ri-folder-line text-lg" />
          <span className="text-[10px] font-mono">Files</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('editor')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
            mobileTab === 'editor'
              ? 'text-accent font-semibold'
              : 'text-[#9D98AA] hover:text-[#F5F3FF]'
          }`}
        >
          <i className="ri-code-s-slash-line text-lg" />
          <span className="text-[10px] font-mono">Editor</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('chat')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
            mobileTab === 'chat'
              ? 'text-accent font-semibold'
              : 'text-[#9D98AA] hover:text-[#F5F3FF]'
          }`}
        >
          <i className="ri-chat-3-line text-lg" />
          <span className="text-[10px] font-mono">Chat</span>
        </button>
      </nav>

      {/* Members Drawer */}
      <MembersDrawer
        isOpen={isMembersDrawerOpen}
        onClose={() => {
          setIsMembersDrawerOpen(false);
          if (mobileTab === 'members') setMobileTab('files');
        }}
        project={project}
        currentUserId={user?._id?.toString() || ''}
        onUpdateMembers={handleUpdateMembers}
        onlineUserIds={socketControls.onlineUserIds}
      />
    </div>
  );
};

export default Project;
