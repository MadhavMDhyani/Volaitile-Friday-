import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useContext, useMemo } from 'react';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import getErrorMessage from '../utils/getErrorMessage';

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(UserContext);

  const [project, setProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [fetchStatus, setFetchStatus] = useState(() => (projectId ? 'loading' : 'notfound'));
  const [fetchErrorMsg, setFetchErrorMsg] = useState('');

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isStudioPanelOpen, setIsStudioPanelOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeStudioTab, setActiveStudioTab] = useState('overview'); // overview, ai, files
  const [copiedId, setCopiedId] = useState(false);
  const [isAddingCollaborators, setIsAddingCollaborators] = useState(false);
  const [modalError, setModalError] = useState('');

  // Project Files State
  const [projectFiles, setProjectFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  // Interactive Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Fetch Project on Mount & projectId Change
  useEffect(() => {
    if (!projectId) {
      return;
    }

    let active = true;

    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        if (!active) return;
        const loadedProj = res.data?.project;
        if (!loadedProj) {
          setFetchStatus('notfound');
          return;
        }
        setProject(loadedProj);
        setProjectUsers(loadedProj.users || []);
        setFetchStatus('success');

        setMessages([
          {
            id: 'welcome-system',
            sender: 'System',
            isSystem: true,
            text: `Workspace loaded for "${loadedProj.name}". Chat is local to this browser session.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: 'welcome-ai',
            sender: 'Friday AI',
            isAi: true,
            text: `Hello! I'm Friday. Mention @friday, "friday", or start a message with "/" for assistance with code or questions.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch project error:', err);
        const status = err.response?.status;
        if (status === 403) {
          setFetchStatus('forbidden');
        } else if (status === 404 || status === 400) {
          setFetchStatus('notfound');
        } else {
          setFetchStatus('error');
          setFetchErrorMsg(getErrorMessage(err, 'Failed to load project details.'));
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  // Handle ESC key to dismiss modal or side panels
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isUserModalOpen) setIsUserModalOpen(false);
        else if (isSidePanelOpen) setIsSidePanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserModalOpen, isSidePanelOpen]);

  // Fetch available users for collaboration
  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      try {
        const res = await axios.get('/users/all');
        const allUsers = res.data.users || [];

        const existingUserIds = new Set(
          (projectUsers || []).map((u) => (typeof u === 'string' ? u : String(u._id)))
        );

        if (active) {
          setAvailableUsers(
            allUsers.filter((u) => !existingUserIds.has(String(u._id)))
          );
        }
      } catch (error) {
        console.error('Failed to fetch available users:', error);
      }
    };

    if (project) {
      fetchUsers();
    }

    return () => {
      active = false;
    };
  }, [project, projectUsers]);

  // Fetch Project Files from Backend
  useEffect(() => {
    if (!project?._id) return;
    let active = true;
    setIsFilesLoading(true);

    axios
      .get(`/projects/${project._id}/files`)
      .then((res) => {
        if (!active) return;
        const files = res.data?.files || [];
        setProjectFiles(files);
        if (files.length > 0) {
          setActiveFile(files[0]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch project files:', err.message);
      })
      .finally(() => {
        if (active) setIsFilesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [project?._id]);

  // Toggle user selection in modal
  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Add selected collaborators in batch
  const handleBatchAddCollaborators = async () => {
    if (!project?._id || selectedUserIds.size === 0) return;

    const userIdsArray = Array.from(selectedUserIds);
    setIsAddingCollaborators(true);
    setModalError('');

    try {
      await axios.put('/projects/add-user', {
        projectId: project._id,
        users: userIdsArray,
      });

      const addedUsers = availableUsers.filter((u) => selectedUserIds.has(u._id));
      setProjectUsers((prev) => [...prev, ...addedUsers]);
      setAvailableUsers((prev) => prev.filter((u) => !selectedUserIds.has(u._id)));
      setSelectedUserIds(new Set());
      setIsUserModalOpen(false);

      const names = addedUsers.map((u) => u.email).join(', ');
      setMessages((prev) => [
        ...prev,
        {
          id: `collab-added-${Date.now()}`,
          sender: 'System',
          isSystem: true,
          text: `Added ${names} to project collaborators.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      console.error('Failed to add collaborators:', error);
      setModalError(getErrorMessage(error, 'Failed to add collaborators.'));
    } finally {
      setIsAddingCollaborators(false);
    }
  };

  // Send Chat Message with precise Friday AI trigger
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: currentUser?.email || 'You',
      isMe: true,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Phase 2 Step 7: Word-boundary regex that only fires on @friday, "friday", or leading "/"
    const isAiQuery = /(?:^|\b)@?friday\b/i.test(text) || text.startsWith('/');

    if (isAiQuery) {
      setIsAiTyping(true);

      axios
        .post('/ai/chat', {
          message: text,
          projectId: project?._id,
        })
        .then((res) => {
          const reply = res.data?.reply;
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'Friday AI',
              isAi: true,
              text: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        })
        .catch((err) => {
          console.warn('AI chat endpoint unreachable, using local assistant:', err.message);
          let aiResponse = `I received your request: "${text}". How can I help with ${project?.name || 'this project'}?`;

          const lower = text.toLowerCase();
          if (lower.includes('docker')) {
            aiResponse = `Suggested Dockerfile for ${project?.name}:\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`;
          } else if (lower.includes('help')) {
            aiResponse = `Commands and actions:\n• Use "Add Member" to invite collaborators to this project\n• Review project details in the Studio panel\n• Mention @friday for coding questions or suggestions.`;
          } else if (lower.includes('collaborator') || lower.includes('team') || lower.includes('member')) {
            aiResponse = `This project currently has ${projectUsers.length} collaborator(s). You can manage them from the top toolbar.`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'Friday AI',
              isAi: true,
              text: aiResponse,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        })
        .finally(() => {
          setIsAiTyping(false);
        });
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInputMessage(promptText);
    chatInputRef.current?.focus();
  };

  const copyProjectId = () => {
    if (!project?._id) return;
    navigator.clipboard?.writeText(project._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredAvailableUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return availableUsers;
    const query = userSearchQuery.toLowerCase();
    return availableUsers.filter((u) => u.email?.toLowerCase().includes(query));
  }, [availableUsers, userSearchQuery]);

  // Loading skeleton screen
  if (fetchStatus === 'loading') {
    return (
      <div className="flex h-screen w-screen flex-col bg-slate-950 text-stone-100 font-sans">
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-slate-800 animate-skeleton" />
            <div className="h-4 w-32 rounded bg-slate-800 animate-skeleton" />
          </div>
          <div className="h-8 w-24 rounded-md bg-slate-800 animate-skeleton" />
        </header>
        <div className="flex flex-1 overflow-hidden p-6 gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-10 w-2/3 rounded-lg bg-slate-900 animate-skeleton" />
            <div className="h-16 w-1/2 rounded-lg bg-slate-900 animate-skeleton" />
            <div className="h-24 w-3/4 rounded-lg bg-slate-900 animate-skeleton" />
          </div>
          <div className="hidden lg:block w-80 rounded-lg bg-slate-900 border border-slate-800 p-4 animate-skeleton" />
        </div>
      </div>
    );
  }

  // 403 Forbidden screen
  if (fetchStatus === 'forbidden') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-stone-100 font-sans">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          <i className="ri-lock-2-line text-2xl" />
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Access Denied</h1>
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-400">
          You do not have access to this project. Ask the project owner to invite you as a collaborator.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
        >
          <i className="ri-arrow-left-line text-base" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  // 404 Not Found screen
  if (fetchStatus === 'notfound') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-stone-100 font-sans">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400">
          <i className="ri-folder-warning-line text-2xl" />
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Project Not Found</h1>
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-400">
          The project you requested does not exist or may have been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
        >
          <i className="ri-arrow-left-line text-base" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  // Error fallback screen
  if (fetchStatus === 'error' || !project) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-stone-100 font-sans">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          <i className="ri-error-warning-line text-2xl" />
        </div>
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-white">Error Loading Project</h1>
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-400">
          {fetchErrorMsg || 'Unable to retrieve project details.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
        >
          <i className="ri-arrow-left-line text-base" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-stone-100">
      {/* Main Workspace Layout */}
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-3 sm:px-4 z-20">
          {/* Left: Back button + Project Identifier */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition focus-ring"
              title="Return to Projects Dashboard"
              aria-label="Back to projects"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base font-bold text-white tracking-tight" title={project.name}>
                {project.name}
              </h1>
              <p className="hidden sm:block text-[11px] font-mono text-slate-400 truncate">
                ID: {project._id}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                setModalError('');
                setSelectedUserIds(new Set());
                setIsUserModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
            >
              <i className="ri-user-add-line text-sm font-bold" />
              <span className="hidden xs:inline sm:inline">Add Member</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus-ring ${
                isSidePanelOpen
                  ? 'border-cyan-500/50 bg-slate-800 text-cyan-400'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Toggle Collaborators List"
              aria-label="Toggle collaborators"
            >
              <i className="ri-team-line text-sm" />
              <span className="font-mono text-[11px]">
                {projectUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsStudioPanelOpen(!isStudioPanelOpen)}
              className={`hidden lg:flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus-ring ${
                isStudioPanelOpen
                  ? 'border-cyan-500/50 bg-slate-800 text-cyan-400'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={isStudioPanelOpen ? 'Collapse Studio' : 'Expand Studio'}
              aria-label="Toggle studio workspace"
            >
              <i className="ri-layout-right-line text-sm" />
              <span>Studio</span>
            </button>
          </div>
        </header>

        {/* Content Body: Chat + Studio Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Chat Channel */}
          <section className="relative flex flex-1 flex-col overflow-hidden bg-slate-950">
            {/* Quick Action Prompts Bar */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-400 no-scrollbar">
              <span className="font-mono text-[11px] text-cyan-400 shrink-0">
                Friday Prompts:
              </span>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday help')}
                className="shrink-0 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-white transition"
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday generate Dockerfile')}
                className="shrink-0 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-white transition"
              >
                Dockerfile
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday what are the collaborator roles?')}
                className="shrink-0 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-white transition"
              >
                Team Roles
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4">
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1 text-xs text-slate-400">
                        <i className="ri-information-line text-cyan-400 text-sm" />
                        <span>{msg.text}</span>
                        <span className="font-mono text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.isAi) {
                  return (
                    <div key={msg.id} className="flex max-w-[88%] sm:max-w-[75%] gap-2.5 animate-fade-in">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500 font-mono text-xs font-bold text-slate-950">
                        VF
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-400">Friday AI</span>
                          <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3.5 text-xs sm:text-sm text-slate-200">
                          <pre className="font-sans whitespace-pre-wrap leading-relaxed">{msg.text}</pre>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.isMe) {
                  return (
                    <div key={msg.id} className="ml-auto flex max-w-[88%] sm:max-w-[75%] flex-col items-end gap-1 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                        <span className="text-xs font-medium text-slate-300">You</span>
                      </div>
                      <div className="rounded-lg bg-cyan-500 p-3 text-xs sm:text-sm font-medium text-slate-950">
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                // Collaborator message
                return (
                  <div key={msg.id} className="flex max-w-[88%] sm:max-w-[75%] gap-2.5 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800 font-mono text-xs font-bold text-white border border-slate-700">
                      {msg.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs sm:text-sm text-slate-200">
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2.5 animate-fade-in">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500 font-mono text-[10px] font-bold text-slate-950">
                    VF
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-cyan-500 animate-spin" />
                    <span>Friday is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="border-t border-slate-800 bg-slate-900 p-3 sm:p-4">
              <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-center gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message or prompt Friday with @friday..."
                  className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-500 px-4 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
                  aria-label="Send message"
                >
                  <span>Send</span>
                </button>
              </form>
            </div>
          </section>

          {/* Right: Studio Workspace Panel (Desktop) */}
          {isStudioPanelOpen && (
            <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-slate-800 bg-slate-950 animate-fade-in">
              {/* Studio Tabs Header */}
              <div className="flex border-b border-slate-800 px-2 pt-2 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('overview')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'overview'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-dashboard-line text-sm" />
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('ai')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'ai'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-robot-2-line text-sm" />
                  <span>Assistant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('files')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'files'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-folder-line text-sm" />
                  <span>Files</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeStudioTab === 'overview' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Project Card */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                      <span className="text-[11px] font-mono uppercase text-slate-400">Project Details</span>
                      <h3 className="mt-1 text-base font-bold text-white">{project.name}</h3>
                      <div className="mt-3 flex items-center justify-between rounded-md bg-slate-950 px-3 py-2 text-xs border border-slate-800">
                        <span className="font-mono text-slate-400 truncate max-w-[200px]">
                          {project._id}
                        </span>
                        <button
                          type="button"
                          onClick={copyProjectId}
                          className="text-cyan-400 hover:text-cyan-300 transition"
                          title="Copy Project ID"
                        >
                          <i className={copiedId ? 'ri-check-line text-green-400' : 'ri-file-copy-line'} />
                        </button>
                      </div>
                    </div>

                    {/* Team Members Summary */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase text-slate-300">
                          Members ({projectUsers.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError('');
                            setSelectedUserIds(new Set());
                            setIsUserModalOpen(true);
                          }}
                          className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {projectUsers.slice(0, 4).map((u, i) => {
                          const email = typeof u === 'string' ? `User (${u.slice(-4)})` : u.email || 'Member';
                          return (
                            <div key={i} className="flex items-center gap-2 rounded-md bg-slate-950 p-2 text-xs border border-slate-800">
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 font-mono text-[10px] font-bold text-slate-300">
                                {email.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate flex-1 text-slate-200">{email}</span>
                            </div>
                          );
                        })}
                        {projectUsers.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setIsSidePanelOpen(true)}
                            className="w-full text-center text-[11px] text-slate-400 hover:text-white pt-1"
                          >
                            + {projectUsers.length - 4} more members
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clean Session Status Area (Replaces Engine Connectivity) */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs">
                      <h4 className="font-semibold text-white mb-1.5">Session Status</h4>
                      <p className="text-slate-400 leading-relaxed">
                        Workspace chat is local to this browser session. Team members and project configurations persist to the server database.
                      </p>
                    </div>
                  </div>
                )}

                {activeStudioTab === 'ai' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                      <h4 className="font-semibold text-xs text-white">Friday Assistant</h4>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        Prompt Friday directly from the message bar with @friday or select an action below.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('@friday help')}
                        className="flex w-full items-center justify-between rounded-md border border-slate-800 bg-slate-900 p-3 text-left text-xs text-slate-200 hover:border-slate-700 transition"
                      >
                        <span>Workspace Help & Commands</span>
                        <i className="ri-arrow-right-line text-cyan-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('@friday generate Dockerfile')}
                        className="flex w-full items-center justify-between rounded-md border border-slate-800 bg-slate-900 p-3 text-left text-xs text-slate-200 hover:border-slate-700 transition"
                      >
                        <span>Generate Dockerfile</span>
                        <i className="ri-arrow-right-line text-cyan-400" />
                      </button>
                    </div>
                  </div>
                )}

                {activeStudioTab === 'files' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-white">Project Files ({projectFiles.length})</h4>
                        {isFilesLoading && (
                          <span className="text-[11px] text-cyan-400 font-mono animate-pulse">Loading...</span>
                        )}
                      </div>

                      {projectFiles.length === 0 ? (
                        <p className="text-xs text-slate-400">No files registered for this project.</p>
                      ) : (
                        <div className="space-y-1 font-mono text-xs">
                          {projectFiles.map((file) => (
                            <button
                              key={file._id || file.path}
                              type="button"
                              onClick={() => setActiveFile(file)}
                              className={`w-full flex items-center justify-between rounded px-2.5 py-1.5 transition text-left ${
                                activeFile?._id === file._id
                                  ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <i
                                  className={
                                    file.language === 'markdown'
                                      ? 'ri-markdown-line text-blue-400'
                                      : file.language === 'json'
                                      ? 'ri-braces-line text-amber-400'
                                      : 'ri-file-code-line text-cyan-400'
                                  }
                                />
                                <span className="truncate">{file.path || file.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase">{file.language}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {activeFile && (
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                          <span className="text-xs font-mono font-medium text-white truncate max-w-[200px]">
                            {activeFile.path || activeFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(activeFile.content || '');
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                            title="Copy file contents"
                          >
                            <i className="ri-file-copy-line" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="max-h-60 overflow-y-auto text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                          {activeFile.content || '// Empty file'}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Collaborators Slide-in Drawer */}
        <aside
          className={`absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-950 transition-transform duration-200 ease-in-out sm:w-80 ${
            isSidePanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-label="Collaborators panel"
        >
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
            <h2 className="text-sm font-bold text-white">Project Members</h2>
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
              aria-label="Close collaborators drawer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setModalError('');
                  setSelectedUserIds(new Set());
                  setIsUserModalOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-ring"
              >
                <i className="ri-user-add-line text-sm font-bold" />
                <span>Invite Collaborators</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {projectUsers.length > 0 ? (
                projectUsers.map((user, idx) => {
                  const userId = typeof user === 'string' ? user : user._id;
                  const userEmail = typeof user === 'string' ? `User ${userId.slice(-6)}` : user.email || 'User';
                  const isCurrent = currentUser?.email && userEmail === currentUser.email;

                  return (
                    <div
                      key={userId || idx}
                      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 font-mono text-xs font-bold text-slate-300 border border-slate-700">
                        {userEmail.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="truncate text-xs font-semibold text-white" title={userEmail}>
                            {userEmail}
                          </h3>
                          {isCurrent && (
                            <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 border border-slate-700">
                              You
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-slate-500 truncate">ID: {userId}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">No collaborators added yet.</div>
              )}
            </div>
          </div>
        </aside>

        {/* Backdrop for Collaborators Drawer on Mobile */}
        {isSidePanelOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden animate-fade-in"
            onClick={() => setIsSidePanelOpen(false)}
          />
        )}
      </div>

      {/* Add Collaborator Modal (Multi-Select with Search & Batch Add) */}
      {isUserModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-collaborator-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 animate-fade-in"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-lg animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 id="add-collaborator-title" className="text-base font-bold text-white">
                  Add Collaborators
                </h2>
                <p className="text-xs text-slate-400">Select users to invite to {project.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200"
              >
                <i className="ri-error-warning-line text-base text-red-400 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{modalError}</p>
              </div>
            )}

            {/* User Search & Selection Stats */}
            <div className="mt-4 flex flex-col gap-2">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Filter users by email..."
                className="w-full rounded-md border border-slate-800 bg-slate-800 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Selected: <strong className="text-cyan-400 font-mono">{selectedUserIds.size}</strong> user(s)
                </span>
                {selectedUserIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds(new Set())}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {filteredAvailableUsers.length > 0 ? (
                filteredAvailableUsers.map((availableUser) => {
                  const isSelected = selectedUserIds.has(availableUser._id);
                  return (
                    <button
                      type="button"
                      key={availableUser._id}
                      onClick={() => toggleUserSelection(availableUser._id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus-ring ${
                        isSelected
                          ? 'border-cyan-500/60 bg-slate-800'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 font-mono font-bold text-white text-xs border border-slate-700">
                        {availableUser.email.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-xs sm:text-sm font-semibold text-white">
                            {availableUser.email}
                          </h4>
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500 text-slate-950 font-bold'
                                : 'border-slate-600 bg-slate-950 text-transparent'
                            }`}
                          >
                            <i className="ri-check-line" />
                          </div>
                        </div>
                        <p className="font-mono text-[10px] text-slate-500">ID: {availableUser._id}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  {userSearchQuery ? 'No users matching query.' : 'No new users available to add.'}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-md border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 focus-ring"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isAddingCollaborators || selectedUserIds.size === 0}
                onClick={handleBatchAddCollaborators}
                className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isAddingCollaborators ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Selected ({selectedUserIds.size})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;
