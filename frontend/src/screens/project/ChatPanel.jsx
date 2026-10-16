import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../config/axios';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import getErrorMessage from '../../utils/getErrorMessage';

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

export const ChatPanel = ({ projectId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastMessageIdRef = useRef(null);
  const isPollingRef = useRef(false);
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
    setIsUserNearBottom(isNear);
    if (isNear) {
      setHasUnreadBelow(false);
    }
  };

  // Poll for messages after the latest message ID
  const pollNewMessages = useCallback(async () => {
    if (!projectId || isPollingRef.current || document.visibilityState !== 'visible') {
      return;
    }

    try {
      isPollingRef.current = true;
      const lastId = lastMessageIdRef.current;
      const url = lastId
        ? `/projects/${projectId}/messages?after=${lastId}&limit=50`
        : `/projects/${projectId}/messages?limit=50`;

      const res = await axios.get(url);
      const incoming = res.data?.messages || [];

      if (incoming.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const brandNew = incoming.filter((m) => !existingIds.has(m._id));
          if (brandNew.length === 0) return prev;

          // Tag new messages so they animate with pop
          const tagged = brandNew.map((m) => ({
            ...m,
            isNew: !isInitialLoadRef.current,
          }));

          const updated = [...prev, ...tagged];
          lastMessageIdRef.current = updated[updated.length - 1]._id;
          return updated;
        });

        if (isUserNearBottom) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          setHasUnreadBelow(true);
        }
      }
    } catch (err) {
      // Ignore background polling network glitches
      console.warn('Poll error:', err?.message);
    } finally {
      isPollingRef.current = false;
    }
  }, [projectId, isUserNearBottom]);

  // Initial Load & Visibility-aware Polling interval
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    isInitialLoadRef.current = true;

    // Load initial history
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

    // Setup 4s polling timer
    let pollInterval = setInterval(() => {
      pollNewMessages();
    }, 4000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollNewMessages();
        clearInterval(pollInterval);
        pollInterval = setInterval(pollNewMessages, 4000);
      } else {
        clearInterval(pollInterval);
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        pollNewMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [projectId, pollNewMessages, toast]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    setInputMessage('');

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
        // Append the returned message object directly
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

    // Regular team message: POST /projects/:projectId/messages
    try {
      setIsSending(true);
      const res = await axios.post(`/projects/${projectId}/messages`, { text });
      const createdMessage = res.data?.message;

      if (createdMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === createdMessage._id)) return prev;
          const next = [...prev, { ...createdMessage, isNew: true }];
          lastMessageIdRef.current = createdMessage._id;
          return next;
        });
        scrollToBottom(true);
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error(getErrorMessage(err, 'Failed to send message'));
      setInputMessage(text); // restore input on failure
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0a] text-[#fafafa] overflow-hidden select-none">
      {/* Chat Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#262626] bg-[#111111] px-3 text-xs">
        <div className="flex items-center gap-2">
          <i className="ri-chat-3-line text-[#a3a3a3]" />
          <span className="font-semibold text-xs text-[#fafafa]">Room Chat & Friday AI</span>
        </div>
        <span className="text-[10px] font-mono text-[#737373]">Updates every few seconds</span>
      </div>

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
              Chat with collaborators or mention <span className="font-mono text-[#fafafa]">@friday</span> for AI
              coding assistance.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAi = msg.isAi;
            const isMe = msg.sender?._id === currentUserId;
            const senderEmail = msg.sender?.email || (isMe ? 'You' : 'Collaborator');
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
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-lg px-3.5 py-2 text-xs leading-relaxed ${
                    isAi
                      ? 'border border-[#262626] bg-[#111111] text-[#fafafa]'
                      : isMe
                      ? 'border border-[#404040] bg-[#171717] text-[#fafafa]'
                      : 'border border-[#262626] bg-[#111111] text-[#a3a3a3]'
                  }`}
                >
                  {isAi ? <SafeMarkdownBlock text={msg.text} /> : <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex flex-col items-start animate-fade-in">
            <span className="text-[11px] font-mono text-[#737373] mb-1">Friday AI is typing…</span>
            <div className="flex items-center gap-1 rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-[#a3a3a3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#fafafa] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
            onChange={(e) => setInputMessage(e.target.value)}
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
