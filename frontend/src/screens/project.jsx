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
  const [mobileTab, setMobileTab] = useState('files'); // 'files' | 'chat' | 'members'

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
      <div className="flex h-screen w-full flex-col bg-[#0a0a0a] text-[#fafafa] font-sans">
        {/* Header Skeleton */}
        <div className="flex h-12 items-center justify-between border-b border-[#262626] bg-[#0a0a0a] px-4">
          <div className="flex items-center gap-3">
            <Skeleton width="24px" height="24px" rounded="rounded" />
            <Skeleton width="140px" height="16px" />
          </div>
          <Skeleton width="90px" height="24px" rounded="rounded" />
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-[#262626] bg-[#111111] p-3 space-y-2">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="100%" height="24px" />
            <Skeleton width="100%" height="24px" />
            <Skeleton width="100%" height="24px" />
          </div>
          <div className="flex-1 bg-[#0a0a0a] p-4">
            <Skeleton width="100%" height="100%" />
          </div>
        </div>
      </div>
    );
  }

  // 403 Forbidden State: User does not have access
  if (fetchStatus === 'forbidden') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-[#fafafa] font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#404040] bg-[#171717] text-[#fafafa] mb-4">
          <i className="ri-lock-line text-2xl text-red-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#fafafa]">
          Access Denied
        </h1>
        <p className="mt-2 text-xs text-[#a3a3a3] max-w-sm">
          You do not have access to this project. Ask the project owner to add you as a collaborator.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // 404 Not Found State
  if (fetchStatus === 'notfound') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-[#fafafa] font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#262626] bg-[#171717] text-[#a3a3a3] mb-4">
          <i className="ri-folder-warning-line text-2xl" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#fafafa]">
          Project Not Found
        </h1>
        <p className="mt-2 text-xs text-[#a3a3a3] max-w-sm">
          The requested project workspace does not exist or may have been deleted.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Error State with Retry
  if (fetchStatus === 'error') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-[#fafafa] font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-400 mb-4">
          <i className="ri-error-warning-line text-2xl" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#fafafa]">
          Unable to Load Workspace
        </h1>
        <p className="mt-2 text-xs text-[#a3a3a3] max-w-sm">
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
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a0a0a] text-[#fafafa] font-sans overflow-hidden">
      {/* Top Navigation */}
      <ProjectHeader
        project={project}
        isOwner={isOwner}
        onOpenMembers={() => setIsMembersDrawerOpen(true)}
        mobileTab={mobileTab}
        onSelectMobileTab={(tab) => {
          setMobileTab(tab);
          if (tab === 'members') {
            setIsMembersDrawerOpen(true);
          }
        }}
      />

      {/* Main Workspace Split Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Layout: Split Files & Chat */}
        {/* Files Panel (File tree + code editor) */}
        <section
          className={`flex-1 flex flex-col min-w-0 border-r border-[#262626] ${
            mobileTab === 'files' ? 'flex' : 'hidden md:flex'
          }`}
          aria-label="File management and code editor"
        >
          <FilesPanel projectId={projectId} />
        </section>

        {/* Chat & AI Panel */}
        <section
          className={`w-full md:w-[380px] lg:w-[440px] shrink-0 flex flex-col ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
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
