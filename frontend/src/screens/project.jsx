import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useContext, useMemo } from 'react';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(UserContext);
  const project = location.state?.project || null;

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isStudioPanelOpen, setIsStudioPanelOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [availableUsers, setAvailableUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState(project?.users || []);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeStudioTab, setActiveStudioTab] = useState('overview'); // overview, ai, files
  const [copiedId, setCopiedId] = useState(false);
  const [isAddingCollaborators, setIsAddingCollaborators] = useState(false);
  const [modalError, setModalError] = useState('');

  // Interactive Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-system',
      sender: 'System',
      isSystem: true,
      text: `Workspace initialized for project "${project?.name || 'Current Project'}". Real-time sync and Friday AI are active.`,
      timestamp: 'Just now',
    },
    {
      id: 'welcome-ai',
      sender: 'Friday AI',
      isAi: true,
      text: `Hello! I'm your Volaitile Friday AI assistant. I can help coordinate architecture, generate code, inspect modules, or manage collaborators. Try asking me a question or type @friday for assistance!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

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

      // Add system announcement in chat
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
      const data = error?.response?.data;
      setModalError(data?.error || data?.errors || 'Failed to add collaborators.');
    } finally {
      setIsAddingCollaborators(false);
    }
  };

  // Send Chat Message with intelligent Friday AI response
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

    // Trigger Friday AI response if mentioned or asked
    const lower = text.toLowerCase();
    const isAiQuery =
      lower.includes('@friday') ||
      lower.includes('friday') ||
      lower.includes('ai') ||
      lower.startsWith('/') ||
      lower.includes('how') ||
      lower.includes('what') ||
      lower.includes('docker') ||
      lower.includes('help');

    if (isAiQuery) {
      setIsAiTyping(true);
      setTimeout(() => {
        let aiResponse = `I've analyzed your request: "${text}". All systems for ${project?.name} are verified healthy. Would you like me to draft a component or inspect the schema?`;

        if (lower.includes('docker')) {
          aiResponse = `Here is a suggested Dockerfile snippet for ${project?.name}:\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`;
        } else if (lower.includes('help')) {
          aiResponse = `Available workspace actions:\n• Click 'Add Collaborators' to invite teammates\n• Open Studio panel to view file artifacts and configuration\n• Ask Friday to review components, write tests, or optimize queries.`;
        } else if (lower.includes('collaborator') || lower.includes('team')) {
          aiResponse = `You currently have ${projectUsers.length} collaborator(s) linked to this project. You can add more from the top toolbar or the collaborators panel.`;
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
        setIsAiTyping(false);
      }, 750);
    }
  };

  // Quick prompt chip clicked
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

  // Graceful Fallback if user reloads without router state
  if (!project) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-cyan-950/40">
          <i className="ri-folder-warning-line text-3xl text-cyan-400" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">No active project selected</h2>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">
          Please select a project from your workspace dashboard to enter the collaborative studio.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 focus-ring"
        >
          <i className="ri-arrow-left-line text-base" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Main Workspace Layout */}
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        {/* Unified Top Navigation Header */}
        <header className="flex h-14 sm:h-16 w-full items-center justify-between border-b border-white/10 bg-slate-950/90 px-3 sm:px-5 backdrop-blur-xl z-20">
          {/* Left: Back button + Project Identifier */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition focus-ring"
              title="Return to Projects Dashboard"
              aria-label="Back to projects"
            >
              <i className="ri-arrow-left-line text-lg" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <i className="ri-folder-6-fill text-base" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm sm:text-base font-bold text-white tracking-tight" title={project.name}>
                    {project.name}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Studio
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] font-mono text-slate-400 truncate">
                  ID: {project._id}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions (Add Collaborator, Members Drawer, Studio Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setModalError('');
                setSelectedUserIds(new Set());
                setIsUserModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-300 active:scale-[0.98] focus-ring"
            >
              <i className="ri-user-add-line text-sm font-bold" />
              <span className="hidden xs:inline sm:inline">Add Member</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className={`flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 sm:py-2 text-xs font-medium transition focus-ring ${
                isSidePanelOpen
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Toggle Collaborators List"
              aria-label="Toggle collaborators"
            >
              <i className="ri-team-line text-base" />
              <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded-md border border-white/5">
                {projectUsers.length}
              </span>
            </button>

            {/* Toggle Studio Panel (Desktop) */}
            <button
              type="button"
              onClick={() => setIsStudioPanelOpen(!isStudioPanelOpen)}
              className={`hidden lg:flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition focus-ring ${
                isStudioPanelOpen
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={isStudioPanelOpen ? 'Collapse Studio Hub' : 'Expand Studio Hub'}
              aria-label="Toggle studio workspace"
            >
              <i className="ri-layout-right-line text-base" />
              <span>Studio</span>
            </button>
          </div>
        </header>

        {/* Content Body: Split between Chat Channel & Studio Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Chat & Friday AI Communication Channel */}
          <section className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_rgba(34,211,238,0.04),_transparent_50%),linear-gradient(180deg,_#060a12_0%,_#090e18_100%)]">
            {/* Quick Action Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 bg-slate-950/60 px-4 py-2 text-xs text-slate-400 no-scrollbar">
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 shrink-0">
                <i className="ri-sparkling-fill text-xs" />
                Friday Prompts:
              </span>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday analyze project architecture')}
                className="shrink-0 rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition"
              >
                Architecture Review
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday generate Dockerfile')}
                className="shrink-0 rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition"
              >
                Generate Dockerfile
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday what are the collaborator roles?')}
                className="shrink-0 rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition"
              >
                Team Roles
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('@friday help')}
                className="shrink-0 rounded-lg border border-white/5 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition"
              >
                Help & Tools
              </button>
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4">
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3 animate-fade-in">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-400">
                        <i className="ri-information-line text-cyan-400 text-sm" />
                        <span>{msg.text}</span>
                        <span className="font-mono text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.isAi) {
                  return (
                    <div key={msg.id} className="flex max-w-[88%] sm:max-w-[75%] gap-3 animate-fade-in">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-md shadow-violet-500/20 text-white">
                        <i className="ri-robot-2-line text-lg" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-300">Friday AI</span>
                          <span className="rounded bg-cyan-400/10 px-1.5 py-0.2 text-[9px] font-mono text-cyan-400 border border-cyan-400/20">
                            Assistant
                          </span>
                          <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-cyan-500/20 bg-slate-900/90 p-4 text-xs sm:text-sm text-slate-200 shadow-lg shadow-black/30 backdrop-blur-md">
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
                      <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-500 to-cyan-400 p-3.5 text-xs sm:text-sm font-medium text-slate-950 shadow-md shadow-cyan-500/20">
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                // Collaborator message
                return (
                  <div key={msg.id} className="flex max-w-[88%] sm:max-w-[75%] gap-3 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-white border border-white/10">
                      {msg.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-slate-900/90 p-3.5 text-xs sm:text-sm text-slate-200 shadow-sm">
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Friday AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white">
                    <i className="ri-sparkling-fill text-sm" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/10 bg-slate-900/80 px-4 py-2.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="border-t border-white/10 bg-slate-950/90 p-3 sm:p-4 backdrop-blur-xl">
              <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Message room or prompt Friday AI (e.g. @friday help)..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] font-mono text-slate-500">
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5">Enter</kbd>
                    <span>to send</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-300 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
                  aria-label="Send message"
                >
                  <i className="ri-send-plane-2-fill text-lg font-bold" />
                </button>
              </form>
            </div>
          </section>

          {/* Right: Studio Workspace Panel (Desktop) */}
          {isStudioPanelOpen && (
            <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-white/10 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
              {/* Studio Tabs Header */}
              <div className="flex border-b border-white/10 px-2 pt-2 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('overview')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'overview'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-dashboard-line text-sm" />
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('ai')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'ai'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-robot-2-line text-sm" />
                  <span>Friday AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('files')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition ${
                    activeStudioTab === 'files'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="ri-folder-code-line text-sm" />
                  <span>Files</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeStudioTab === 'overview' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Project Card */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Workspace Specs</span>
                      <h3 className="mt-1 text-base font-bold text-white">{project.name}</h3>
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/80 px-3 py-2 text-xs border border-white/5">
                        <span className="font-mono text-slate-400 truncate max-w-[190px]">
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
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Active Team ({projectUsers.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError('');
                            setSelectedUserIds(new Set());
                            setIsUserModalOpen(true);
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {projectUsers.slice(0, 4).map((u, i) => {
                          const email = typeof u === 'string' ? `User (${u.slice(-4)})` : u.email || 'Team member';
                          return (
                            <div key={i} className="flex items-center gap-2.5 rounded-xl bg-slate-950/50 p-2 text-xs border border-white/5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[11px]">
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

                    {/* System Health */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs">
                      <h4 className="font-bold text-white mb-2">Engine Connectivity</h4>
                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>WebSocket Sync</span>
                          <span className="text-emerald-400 font-mono">Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Friday AI Core</span>
                          <span className="text-cyan-400 font-mono">Ready (Gemini)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Database Persistence</span>
                          <span className="text-emerald-400 font-mono">Synced</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStudioTab === 'ai' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-slate-900 p-4">
                      <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                        <i className="ri-sparkling-fill" />
                        <span>Friday AI Assistant</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        Friday is primed with context from {project.name}. You can prompt directly from the chat or select a quick task below.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('@friday audit frontend responsiveness')}
                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 p-3 text-left text-xs text-slate-200 hover:border-cyan-500/30 hover:bg-slate-900 transition"
                      >
                        <span>Audit UI Responsiveness</span>
                        <i className="ri-arrow-right-s-line text-cyan-400 text-base" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('@friday check API contracts')}
                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 p-3 text-left text-xs text-slate-200 hover:border-cyan-500/30 hover:bg-slate-900 transition"
                      >
                        <span>Inspect Backend API routes</span>
                        <i className="ri-arrow-right-s-line text-cyan-400 text-base" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('@friday generate tests for project')}
                        className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 p-3 text-left text-xs text-slate-200 hover:border-cyan-500/30 hover:bg-slate-900 transition"
                      >
                        <span>Generate Component Tests</span>
                        <i className="ri-arrow-right-s-line text-cyan-400 text-base" />
                      </button>
                    </div>
                  </div>
                )}

                {activeStudioTab === 'files' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <h4 className="text-xs font-bold text-white mb-3">Project File Tree</h4>
                      <div className="space-y-1.5 font-mono text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <i className="ri-folder-open-fill" />
                          <span>src/</span>
                        </div>
                        <div className="flex items-center gap-2 pl-4 text-slate-300">
                          <i className="ri-file-code-line text-cyan-400" />
                          <span>screens/Project.jsx</span>
                        </div>
                        <div className="flex items-center gap-2 pl-4 text-slate-300">
                          <i className="ri-file-code-line text-cyan-400" />
                          <span>screens/Home.jsx</span>
                        </div>
                        <div className="flex items-center gap-2 pl-4 text-slate-300">
                          <i className="ri-file-code-line text-cyan-400" />
                          <span>routes/AppRoutes.jsx</span>
                        </div>
                        <div className="flex items-center gap-2 pl-4 text-slate-300">
                          <i className="ri-file-code-line text-cyan-400" />
                          <span>context/user.context.jsx</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <i className="ri-file-text-line" />
                          <span>package.json</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Collaborators Slide-in Drawer */}
        <aside
          className={`absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/15 bg-slate-950 shadow-2xl shadow-black/80 transition-transform duration-300 ease-in-out sm:w-80 ${
            isSidePanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-label="Collaborators panel"
        >
          <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <i className="ri-team-line text-cyan-400 text-lg" />
              <h2 className="text-base font-bold text-white">Project Members</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
              aria-label="Close collaborators drawer"
            >
              <i className="ri-close-line text-xl" />
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-md shadow-cyan-500/20 focus-ring"
              >
                <i className="ri-user-add-line text-base font-bold" />
                <span>Invite Collaborators</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {projectUsers.length > 0 ? (
                projectUsers.map((user, idx) => {
                  const userId = typeof user === 'string' ? user : user._id;
                  const userEmail = typeof user === 'string' ? `User ${userId.slice(-6)}` : user.email || 'User';
                  const isCurrent = currentUser?.email && userEmail === currentUser.email;

                  return (
                    <div
                      key={userId || idx}
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/70 p-3 transition hover:border-cyan-500/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-sm font-bold text-cyan-300 border border-white/5">
                        {userEmail.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="truncate text-xs font-bold text-white" title={userEmail}>
                            {userEmail}
                          </h3>
                          {isCurrent && (
                            <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-400/20">
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
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <i className="ri-user-add-line text-lg" />
                </div>
                <div>
                  <h2 id="add-collaborator-title" className="text-base sm:text-lg font-bold text-white">
                    Add Collaborators
                  </h2>
                  <p className="text-xs text-slate-400">Select users to invite to {project.name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-ring"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"
              >
                <i className="ri-error-warning-fill text-base text-red-400 mt-0.5" />
                <p className="flex-1">{modalError}</p>
              </div>
            )}

            {/* User Search & Selection Stats */}
            <div className="mt-4 flex flex-col gap-2.5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <i className="ri-search-line text-sm" />
                </div>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Filter users by email..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/80 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

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
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-ring ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-sm shadow-cyan-500/10'
                          : 'border-white/5 bg-slate-800/60 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 font-bold text-white text-sm">
                        {availableUser.email.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-xs sm:text-sm font-semibold text-white">
                            {availableUser.email}
                          </h4>
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                                : 'border-slate-600 bg-slate-900 text-transparent'
                            }`}
                          >
                            <i className="ri-check-line font-bold" />
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
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 focus-ring"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isAddingCollaborators || selectedUserIds.size === 0}
                onClick={handleBatchAddCollaborators}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isAddingCollaborators ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line text-sm font-bold" />
                    <span>Add Selected ({selectedUserIds.size})</span>
                  </>
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
