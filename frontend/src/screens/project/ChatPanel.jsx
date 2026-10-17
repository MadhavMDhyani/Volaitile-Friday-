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
          <strong key={idx} className="font-semibold text-[#fafafa]">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code
            key={idx}
            className="rounded border border-[#262626] bg-[#0a0a0a] px-1 py-0.5 font-mono text-[11px] text-[#fafafa]"
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
      <div key={key} className="my-2 rounded-md border border-[#262626] bg-[#0a0a0a] text-xs font-mono overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#262626] bg-[#111111] px-3 py-1 text-[10px] text-[#737373]">
          <span className="uppercase">{lang || 'CODE'}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[#a3a3a3] hover:text-[#fafafa] flex items-center gap-1 focus-ring rounded"
            title="Copy code"
            aria-label="Copy code block"
          >
            <i className="ri-file-copy-line text-xs" />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-3 overflow-x-auto text-[#fafafa] leading-relaxed">
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
          <span className="text-[#737373] select-none">•</span>
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

export const ChatPanel = ({ projectId, currentUserId, socketControls }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastMessageIdRef = useRef(null);
  const isUserNearBottomRef = useRef(true);
  const typingDebounceRef = useRef(null);
  const isFetchingMissedRef = useRef(false);
  const toast = useToast();

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
    [currentUserId]
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

  // Typing event handler with debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    const isAi = val.startsWith('/') || val.toLowerCase().includes('@friday');
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

    // Check if this is an AI query: mentions @friday or starts with /
    const isAiPrompt = text.toLowerCase().includes('@friday') || text.startsWith('/');

    if (isAiPrompt) {
      // Create local user message optimistically
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        _id: tempId,
        text,
        sender: { _id: currentUserId, email: 'You' },
        createdAt: new Date().toISOString(),
        isAi: false,
        isNew: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setIsAiTyping(true);
      scrollToBottom(true);

      try {
        const aiRes = await axios.post('/ai/chat', {
          message: text,
          projectId,
        });

        // The AI reply was automatically saved as a Message on the backend when projectId is sent!
        const returnedAiMessage = aiRes.data?.message || {
          _id: `ai-${Date.now()}`,
          text: aiRes.data?.reply || 'Assistant response received.',
          isAi: true,
          sender: null,
          createdAt: new Date().toISOString(),
        };

        const aiSource = aiRes.data?.source; // 'gemini' | 'offline'

        setMessages((prev) => [
          ...prev,
          {
            ...returnedAiMessage,
            aiSource,
            isNew: true,
          },
        ]);
        lastMessageIdRef.current = returnedAiMessage._id;
        scrollToBottom(true);
      } catch (err) {
        console.error('AI chat error:', err);
        toast.error(getErrorMessage(err, 'Failed to obtain AI response'));
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    // Regular team message: optimistic display then send via WebSocket (with REST fallback)
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

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);
    setIsSending(true);

    try {
      if (connected) {
        // Send via Socket "chat:send"
        const res = await sendMessage(text, tempId);
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
        // Fallback to REST endpoint POST /projects/:projectId/messages
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
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(getErrorMessage(err, 'Failed to send message'));
      // Remove failed optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInputMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  // Filter out current user from typing indicators
  const otherTypingUsers = (typingUsers || []).filter((u) => u.userId !== currentUserId);

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0a] text-[#fafafa] overflow-hidden select-none">
      {/* Chat Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#262626] bg-[#111111] px-3 text-xs">
        <div className="flex items-center gap-2">
          <i className="ri-chat-3-line text-[#a3a3a3]" />
          <span className="font-semibold text-xs text-[#fafafa]">Room Chat & Friday AI</span>
        </div>

        {/* Live presence indicator */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className={connected ? 'text-[#a3a3a3]' : 'text-amber-400'}>
            {connected
              ? `${onlineUserIds.length} ${onlineUserIds.length === 1 ? 'member' : 'members'} online`
              : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Disconnected / Reconnecting banner */}
      {isReconnecting && (
        <div className="flex items-center justify-between bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-[11px] text-amber-400 font-mono animate-fade-in">
          <div className="flex items-center gap-2">
            <i className="ri-loader-4-line animate-spin text-xs" />
            <span>Reconnecting to real-time chat...</span>
          </div>
          <span className="text-[10px] text-amber-400/70">Syncing live events</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3 relative select-text"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-[#737373]">
            <i className="ri-chat-smile-2-line text-3xl mb-2 text-[#404040]" />
            <p className="text-xs font-medium text-[#a3a3a3]">No messages in this workspace yet</p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-xs">
              Chat live with collaborators or mention <span className="font-mono text-[#fafafa]">@friday</span> for AI
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
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-[#737373]">
                  {isAi ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#fafafa]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Friday AI
                      {msg.aiSource === 'offline' && (
                        <span className="text-[9px] rounded border border-[#404040] bg-[#171717] px-1 text-[#737373] uppercase">
                          Offline assistant
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>{senderEmail}</span>
                  )}
                  {formattedTime && <span className="text-[10px] text-[#525252]">{formattedTime}</span>}
                  {isOptimistic && (
                    <span className="text-[9px] text-[#737373] italic">sending...</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-lg px-3.5 py-2 text-xs leading-relaxed ${
                    isAi
                      ? 'border border-[#262626] bg-[#111111] text-[#fafafa]'
                      : isMe
                      ? `border border-[#404040] bg-[#171717] text-[#fafafa] ${isOptimistic ? 'opacity-70' : ''}`
                      : 'border border-[#262626] bg-[#111111] text-[#a3a3a3]'
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
            <span className="text-[11px] font-mono text-[#737373] mb-1">Friday AI is thinking…</span>
            <div className="flex items-center gap-1 rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-[#a3a3a3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator for other members */}
      {otherTypingUsers.length > 0 && (
        <div className="flex items-center gap-2 border-t border-[#262626] bg-[#0d0d0d] px-3 py-1.5 text-[11px] font-mono text-[#a3a3a3] animate-fade-in">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
            className="shadow-md"
          >
            New messages
          </Button>
        </div>
      )}

      {/* Input Box Area */}
      <form onSubmit={handleSendMessage} className="border-t border-[#262626] bg-[#111111] p-2.5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type a message or @friday for AI assistance..."
            className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] pl-3 pr-20 py-2 text-xs text-[#fafafa] placeholder-[#737373] focus-ring transition-colors"
            maxLength={2000}
            disabled={isSending}
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            <Button
              type="submit"
              variant="primary"
              size="xs"
              disabled={!inputMessage.trim() || isSending}
              loading={isSending}
              icon={<i className="ri-send-plane-2-fill text-xs" />}
            >
              Send
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
