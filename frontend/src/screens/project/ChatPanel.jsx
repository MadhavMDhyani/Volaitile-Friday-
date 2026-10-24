import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../config/axios';
import Button from '../../components/Button';
import { useToast } from '../../context/useToast';
import getErrorMessage from '../../utils/getErrorMessage';
import useProjectSocket from '../../hooks/useProjectSocket';

// Safe minimal markdown renderer without external libraries or dangerous innerHTML
const SafeMarkdownBlock = ({ text }) => {
  const parts = [];
  const lines = (text || '').split('\n');
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';

  const renderInline = (str) => {
    // Splits on bold **text** and inline `code`
    const tokens = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return (
          <strong key={idx} className="font-semibold text-[#f3e6da]">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code
            key={idx}
            className="rounded-md border border-white/[0.1] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[#c4b5a8]"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  const renderCodeBox = (code, lang, key) => {
    const handleCopy = () => {
      navigator.clipboard.writeText(code);
    };

    return (
      <div key={key} className="my-2.5 rounded-xl border border-white/[0.1] bg-[#07090e]/95 text-xs font-mono overflow-hidden shadow-glass">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] text-[#a89384]">
          <span className="uppercase text-accent font-semibold">{lang || 'CODE'}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[#a89384] hover:text-[#f3e6da] flex items-center gap-1 focus-ring rounded px-1.5 py-0.5 transition-colors"
            title="Copy code"
            aria-label="Copy code block"
          >
            <i className="ri-file-copy-line text-xs" />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-3.5 overflow-x-auto text-[#f3e6da] leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Closing code block
        parts.push(renderCodeBox(codeBuffer.join('\n'), codeLang, `code-${index}`));
        codeBuffer = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        // Opening code block
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      parts.push(
        <div key={`li-${index}`} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-[#6e5d50] select-none">•</span>
          <span className="flex-1">{renderInline(line.trim().slice(2))}</span>
        </div>
      );
      return;
    }

    if (line.trim().length > 0) {
      parts.push(
        <p key={`p-${index}`} className="my-1 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  // Handle unclosed code block if message was cut off
  if (inCodeBlock && codeBuffer.length > 0) {
    parts.push(renderCodeBox(codeBuffer.join('\n'), codeLang, 'code-end'));
  }

  return <div className="space-y-1">{parts}</div>;
};

const MAX_MESSAGE_LENGTH = 4000;
const AI_COMMAND_REGEX = /^(?:\/help|\/docker|\/auth|\/db|\/test|\/git)(?:\s|$)/i;

const isAiTrigger = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return /@friday/i.test(trimmed) || AI_COMMAND_REGEX.test(trimmed);
};

export const ChatPanel = ({ projectId, currentUserId, socketControls }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      return localStorage.getItem('friday_selected_model') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastMessageIdRef = useRef(null);
  const isUserNearBottomRef = useRef(true);
  const typingDebounceRef = useRef(null);
  const isFetchingMissedRef = useRef(false);
  const aiTypingTimeoutRef = useRef(null);
  const toast = useToast();

  const startAiTyping = useCallback(() => {
    setIsAiTyping(true);
    if (aiTypingTimeoutRef.current) clearTimeout(aiTypingTimeoutRef.current);
    aiTypingTimeoutRef.current = setTimeout(() => {
      setIsAiTyping(false);
      aiTypingTimeoutRef.current = null;
    }, 45000);
  }, []);

  const clearAiTyping = useCallback(() => {
    setIsAiTyping(false);
    if (aiTypingTimeoutRef.current) {
      clearTimeout(aiTypingTimeoutRef.current);
      aiTypingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (aiTypingTimeoutRef.current) {
        clearTimeout(aiTypingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
    setHasUnreadBelow(false);
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceToBottom < 100;
    isUserNearBottomRef.current = isNear;
    if (isNear) {
      setHasUnreadBelow(false);
    }
  };

  // Append new live message from WebSocket
  const handleIncomingMessage = useCallback(
    (msg) => {
      if (!msg || !msg._id) return;

      if (msg.isAi) {
        clearAiTyping();
      } else if (isAiTrigger(msg.text)) {
        startAiTyping();
      }

      setMessages((prev) => {
        // Deduplicate if already present
        if (prev.some((m) => m._id === msg._id)) return prev;

        // If from current user, check if we have a matching optimistic message to replace
        const senderId = msg.sender?._id ? msg.sender._id.toString() : msg.sender?.toString();
        if (senderId && currentUserId && senderId === currentUserId) {
          const tempIdx = prev.findIndex(
            (m) => typeof m._id === 'string' && m._id.startsWith('temp-') && m.text === msg.text
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = { ...msg, isNew: false };
            lastMessageIdRef.current = msg._id;
            return next;
          }
        }

        const next = [...prev, { ...msg, isNew: !isInitialLoadRef.current }];
        lastMessageIdRef.current = msg._id;
        return next;
      });

      if (isUserNearBottomRef.current) {
        setTimeout(() => scrollToBottom(true), 50);
      } else {
        setHasUnreadBelow(true);
      }
    },
    [currentUserId, clearAiTyping, startAiTyping]
  );

  // Fetch missed messages after WebSocket reconnect
  const fetchMissedMessages = useCallback(async () => {
    if (!projectId || !lastMessageIdRef.current || isFetchingMissedRef.current) {
      return;
    }

    try {
      isFetchingMissedRef.current = true;
      const url = `/projects/${projectId}/messages?after=${lastMessageIdRef.current}&limit=50`;
      const res = await axios.get(url);
      const incoming = res.data?.messages || [];

      if (incoming.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const brandNew = incoming.filter((m) => !existingIds.has(m._id));
          if (brandNew.length === 0) return prev;

          const tagged = brandNew.map((m) => ({ ...m, isNew: true }));
          const updated = [...prev, ...tagged];
          lastMessageIdRef.current = updated[updated.length - 1]._id;
          return updated;
        });

        if (isUserNearBottomRef.current) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          setHasUnreadBelow(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch missed messages after reconnect:', err?.message);
    } finally {
      isFetchingMissedRef.current = false;
    }
  }, [projectId]);

  // Use internal hook if not passed from parent
  const internalSocket = useProjectSocket(socketControls ? null : projectId, {
    onMessage: handleIncomingMessage,
    onReconnect: fetchMissedMessages,
  });

  const activeSocket = socketControls || internalSocket;
  const {
    connected,
    isReconnecting,
    onlineUserIds,
    typingUsers,
    sendMessage,
    sendTyping,
    subscribeToMessages,
  } = activeSocket;

  // If using socketControls from parent, subscribe to incoming messages & reconnect
  useEffect(() => {
    if (!socketControls || typeof subscribeToMessages !== 'function') return;
    const unsubscribe = subscribeToMessages(handleIncomingMessage);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [socketControls, subscribeToMessages, handleIncomingMessage]);

  // Initial History Load via REST GET endpoint
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    isInitialLoadRef.current = true;

    axios
      .get(`/projects/${projectId}/messages?limit=50`)
      .then((res) => {
        if (!isMounted) return;
        const initialMessages = res.data?.messages || [];
        setMessages(initialMessages);
        if (initialMessages.length > 0) {
          lastMessageIdRef.current = initialMessages[initialMessages.length - 1]._id;
        }
        setTimeout(() => {
          scrollToBottom(false);
          isInitialLoadRef.current = false;
        }, 100);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch messages error:', err);
          toast.error(getErrorMessage(err, 'Failed to load chat messages'));
          isInitialLoadRef.current = false;
        }
      });

    return () => {
      isMounted = false;
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, [projectId, toast]);

  // Fetch available AI models on mount
  useEffect(() => {
    let isMounted = true;
    axios
      .get('/ai/models')
      .then((res) => {
        if (!isMounted) return;
        const modelsList = res.data?.models || (Array.isArray(res.data) ? res.data : []);
        setAvailableModels(modelsList);
      })
      .catch(() => {
        // If /ai/models fails, hide dropdown and preserve default behavior
        if (isMounted) {
          setAvailableModels([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleModelChange = (e) => {
    const val = e.target.value;
    setSelectedModel(val);
    try {
      localStorage.setItem('friday_selected_model', val);
    } catch (err) {
      console.warn('Could not save AI model preference to localStorage:', err);
    }
  };

  // Typing event handler with debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    const isAi = isAiTrigger(val);
    if (isAi) {
      sendTyping(false);
      return;
    }

    if (val.trim().length > 0) {
      sendTyping(true);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    } else {
      sendTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    setInputMessage('');
    sendTyping(false);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);

    const isAi = isAiTrigger(text);

    // Optimistic message display
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      tempId,
      text,
      sender: { _id: currentUserId, email: 'You' },
      createdAt: new Date().toISOString(),
      isAi: false,
      isNew: true,
    };

    setMessages((prev) => {
      if (prev.some((m) => m._id === tempId)) return prev;
      return [...prev, optimisticMsg];
    });
    scrollToBottom(true);
    setIsSending(true);

    if (isAi) {
      startAiTyping();
    }

    try {
      if (connected) {
        // Send via Socket "chat:send" with model (server handles AI trigger and broadcast)
        const res = await sendMessage(text, tempId, selectedModel);
        if (res?.ok && res.message) {
          const createdMessage = res.message;
          setMessages((prev) => {
            const hasReal = prev.some((m) => m._id === createdMessage._id);
            if (hasReal) {
              return prev.filter((m) => m._id !== tempId);
            }
            return prev.map((m) => (m._id === tempId ? { ...createdMessage, isNew: false } : m));
          });
          lastMessageIdRef.current = createdMessage._id;
        } else {
          throw new Error(res?.error || 'Failed to send message over socket');
        }
      } else {
        // Disconnected fallback: POST /projects/:projectId/messages then POST /ai/chat
        const res = await axios.post(`/projects/${projectId}/messages`, { text });
        const createdMessage = res.data?.message;

        if (createdMessage) {
          setMessages((prev) => {
            const hasReal = prev.some((m) => m._id === createdMessage._id);
            if (hasReal) {
              return prev.filter((m) => m._id !== tempId);
            }
            return prev.map((m) => (m._id === tempId ? { ...createdMessage, isNew: false } : m));
          });
          lastMessageIdRef.current = createdMessage._id;
        }

        if (isAi) {
          try {
            const aiRes = await axios.post('/ai/chat', {
              message: text,
              projectId,
              model: selectedModel,
            });

            const returnedAiMessage = aiRes.data?.message;
            if (returnedAiMessage) {
              setMessages((prev) => {
                if (prev.some((m) => m._id === returnedAiMessage._id)) return prev;
                return [...prev, { ...returnedAiMessage, isNew: true }];
              });
              lastMessageIdRef.current = returnedAiMessage._id;
              scrollToBottom(true);
            }
          } catch (aiErr) {
            console.error('AI chat error:', aiErr);
            toast.error(getErrorMessage(aiErr, 'Failed to obtain AI response'));
          } finally {
            clearAiTyping();
          }
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(getErrorMessage(err, 'Failed to send message'));
      // Remove failed optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInputMessage(text);
      if (isAi) {
        clearAiTyping();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Filter out current user from typing indicators
  const otherTypingUsers = (typingUsers || []).filter((u) => u.userId !== currentUserId);

  return (
    <div className="flex h-full w-full flex-col bg-[#07090e]/85 backdrop-blur-xl text-[#f3e6da] overflow-hidden select-none">
      {/* Chat Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0a0c12]/90 backdrop-blur-md px-3.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <i className="ri-chat-3-line text-accent shrink-0" />
          <span className="font-semibold text-xs text-[#f3e6da] truncate">Room Chat & Friday AI</span>
        </div>

        {/* Live presence indicator */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] tabular-nums">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              connected ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-accent animate-pulse'
            }`}
          />
          <span className={`whitespace-nowrap ${connected ? 'text-[#a89384]' : 'text-accent'}`}>
            {connected
              ? `${onlineUserIds.length} ${onlineUserIds.length === 1 ? 'member' : 'members'} online`
              : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Disconnected / Reconnecting banner */}
      {isReconnecting && (
        <div className="flex items-center justify-between bg-accent-tint/30 border-b border-accent-deep px-3 py-1.5 text-[11px] text-accent font-mono animate-fade-in backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <i className="ri-loader-4-line animate-spin text-xs" />
            <span>Reconnecting to real-time chat...</span>
          </div>
          <span className="text-[10px] text-accent/70">Syncing live events</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-3 relative select-text"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-[#6e5d50]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass border-glass-border/40 text-accent/50 mb-3 shadow-glass">
              <i className="ri-chat-smile-2-line text-2xl" />
            </div>
            <p className="text-xs font-medium text-[#f3e6da]">No messages in this workspace yet</p>
            <p className="text-[11px] text-[#a89384] mt-1 max-w-xs leading-relaxed">
              Chat live with collaborators or mention <span className="font-mono text-accent font-semibold">@friday</span> for AI
              assistance.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAi = msg.isAi;
            const senderId = msg.sender?._id ? msg.sender._id.toString() : msg.sender?.toString();
            const isMe = senderId === currentUserId;
            const senderEmail = msg.sender?.email || (isMe ? 'You' : 'Collaborator');
            const isOptimistic = typeof msg._id === 'string' && msg._id.startsWith('temp-');
            const formattedTime = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isAi ? 'items-start' : isMe ? 'items-end' : 'items-start'} ${
                  msg.isNew ? 'animate-pop' : ''
                }`}
              >
                {/* Header label */}
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-[#a89384] max-w-full">
                  {isAi ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#f3e6da] min-w-0 flex-wrap">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)] animate-pulse" />
                      <span className="text-accent font-bold shrink-0">Friday AI</span>
                      {(() => {
                        const isOffline =
                          msg.source === 'offline' ||
                          msg.aiSource === 'offline' ||
                          msg.model === 'offline';
                        const answeringModelId = msg.model;
                        const requestedModel = msg.requestedModel;
                        const latencyMs = msg.latencyMs;

                        if (isOffline || (!msg.source && !msg.model)) {
                          const isFallback = Boolean(
                            requestedModel &&
                              requestedModel !== 'offline' &&
                              requestedModel !== 'auto'
                          );
                          return (
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="text-[9px] rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.2 text-[#a89384] uppercase cursor-default font-mono"
                                title={latencyMs ? `Latency: ${latencyMs}ms` : undefined}
                              >
                                Offline
                              </span>
                              {isFallback && (
                                <span
                                  className="text-[9px] text-accent-hover font-mono lowercase italic"
                                  title={`Requested ${requestedModel}`}
                                >
                                  fallback used
                                </span>
                              )}
                            </span>
                          );
                        }

                        const matched = availableModels.find((m) => m.id === answeringModelId);
                        const speed = matched?.speed
                          ? matched.speed.charAt(0).toUpperCase() + matched.speed.slice(1)
                          : null;
                        const label = speed
                          ? `Gemini - ${speed}`
                          : matched?.label || answeringModelId || 'Gemini';

                        const isFallback = Boolean(
                          requestedModel &&
                            requestedModel !== 'auto' &&
                            answeringModelId &&
                            requestedModel !== answeringModelId
                        );

                        return (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="text-[9px] rounded-full border border-accent/30 bg-accent/10 px-2 py-0.2 text-accent font-mono cursor-default"
                              title={latencyMs ? `Latency: ${latencyMs}ms` : undefined}
                            >
                              {label}
                            </span>
                            {isFallback && (
                              <span
                                className="text-[9px] text-accent-hover font-mono lowercase italic"
                                title={`Requested ${requestedModel}`}
                              >
                                fallback used
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </span>
                  ) : (
                    <span className="font-mono truncate max-w-[150px] sm:max-w-[220px]" title={senderEmail}>{senderEmail}</span>
                  )}
                  {formattedTime && <span className="text-[10px] text-white/35 tabular-nums shrink-0 ml-0.5">{formattedTime}</span>}
                  {isOptimistic && (
                    <span className="text-[9px] text-accent/70 italic shrink-0">sending...</span>
                  )}
                </div>

                {/* Message Bubble - translucent without individual blur for maximum performance */}
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isAi
                      ? 'border border-accent-deep bg-accent-tint/20 text-[#c4b5a8] shadow-glass'
                      : isMe
                      ? `border border-accent-press/30 bg-accent-tint/25 text-[#f3e6da] shadow-glass ${isOptimistic ? 'opacity-70' : ''}`
                      : 'border border-white/[0.08] bg-white/[0.04] text-[#e5e5e5]'
                  }`}
                >
                  {isAi ? (
                    <SafeMarkdownBlock text={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex flex-col items-start animate-fade-in">
            <span className="text-[11px] font-mono text-accent/80 mb-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Friday AI is thinking…
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl border border-accent-deep bg-accent-tint/20 px-3.5 py-2 text-xs text-accent shadow-glass">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator for other members */}
      {otherTypingUsers.length > 0 && (
        <div className="flex items-center gap-2 border-t border-white/[0.08] bg-[#140d09]/80 px-3.5 py-1.5 text-[11px] font-mono text-[#a89384] animate-fade-in backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="truncate">
            {otherTypingUsers.length === 1
              ? `${otherTypingUsers[0].email} is typing...`
              : otherTypingUsers.length === 2
              ? `${otherTypingUsers[0].email} and ${otherTypingUsers[1].email} are typing...`
              : 'Several collaborators are typing...'}
          </span>
        </div>
      )}

      {/* Floating "New Messages" Jump Button */}
      {hasUnreadBelow && (
        <div className="absolute bottom-16 right-4 z-20">
          <Button
            variant="primary"
            size="xs"
            onClick={() => scrollToBottom(true)}
            icon={<i className="ri-arrow-down-line text-xs" />}
            className="shadow-glass"
          >
            New messages
          </Button>
        </div>
      )}

      {/* Input Box Area - Liquid Glass Composer */}
      <form onSubmit={handleSendMessage} className="glass-liquid border-t border-white/[0.08] p-2.5 sm:p-3">
        {/* Model pill / bar if models available */}
        {availableModels.length > 0 && (
          <div className="flex items-center justify-between gap-2 mb-2 px-1 text-[10px] font-mono text-[#a89384]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)] shrink-0" />
              <span className="text-white/50 text-[10px] shrink-0">Model:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="h-6 rounded-full glass-pill border border-white/[0.12] bg-raised/80 px-2 pr-5 text-[10px] font-mono text-accent hover:text-white focus:border-accent/60 cursor-pointer appearance-none transition-all outline-none"
                  title="Select Friday AI model"
                  aria-label="Friday AI model selection"
                >
                  <option value="auto" className="bg-[#111] text-white">Auto (Best match)</option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#111] text-white">
                      {m.label} ({m.speed})
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line pointer-events-none absolute right-1.5 text-[10px] text-accent/70" />
              </div>
            </div>
            <span className="text-[10px] text-white/40 hidden sm:inline tabular-nums">
              {inputMessage.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-1 min-w-0 flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type a message or @friday..."
              className="w-full h-10 min-w-0 rounded-xl glass-input px-3.5 text-xs text-[#f3e6da] placeholder-white/40 transition-all"
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSending}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputMessage.trim() || isSending}
            loading={isSending}
            icon={<i className="ri-send-plane-2-fill text-sm" />}
            className="h-10 w-10 shrink-0 p-0 flex items-center justify-center rounded-xl"
            title="Send message"
            aria-label="Send message"
          />
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
