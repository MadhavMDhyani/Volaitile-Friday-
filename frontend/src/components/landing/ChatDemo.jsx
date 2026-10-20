import { useState, useEffect, useRef } from 'react';
import Reveal from './Reveal';

const DEMO_CONVERSATIONS = [
  {
    user: '@friday review our auth rate limiter in Express',
    ai: 'Your express-rate-limit config uses 10 requests / 15 minutes for /login, which prevents brute force attacks. Ensure `trust proxy: 1` is enabled behind your Nginx reverse proxy so client IPs are verified correctly.',
  },
  {
    user: '/docker how are our MongoDB and Redis ports secured?',
    ai: 'In docker-compose.yml, MongoDB and Redis do NOT bind public ports to the host. They communicate strictly over the internal isolated bridge network, protecting datastores from external access.',
  },
];

export const ChatDemo = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);

  const current = DEMO_CONVERSATIONS[activeIdx];

  // Pause when offscreen or tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsPaused(!entry.isIntersecting);
          });
        },
        { threshold: 0.1 }
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Time-based character typewriter inside isolated box (contain: layout paint)
  useEffect(() => {
    if (isPaused) return;

    if (typedChars < current.ai.length) {
      const timer = setTimeout(() => {
        setTypedChars((prev) => Math.min(prev + 3, current.ai.length));
      }, 35);
      return () => clearTimeout(timer);
    } else {
      // Pause at the end before switching to the next prompt
      const switchTimer = setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % DEMO_CONVERSATIONS.length);
        setTypedChars(0);
      }, 4000);
      return () => clearTimeout(switchTimer);
    }
  }, [typedChars, activeIdx, isPaused, current.ai.length]);

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal delay={0}>
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-yellow font-semibold">
              LIVE PREVIEW
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#fafafa]">
              Ask Friday anything about your codebase
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100} transformOnly={true}>
          <div
            ref={containerRef}
            className="rounded-2xl glass-strong border border-white/[0.22] p-5 sm:p-7 shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
                <span className="font-semibold text-white">Friday AI Room Assistant</span>
              </div>
              <span className="text-[10px] text-cyan-300 rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5">
                Gemini 2.5 Flash
              </span>
            </div>

            {/* Conversation Area */}
            <div className="space-y-4">
              {/* User question */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-[#a3a3a3] mb-1">lead-dev@company.com</span>
                <div className="rounded-2xl border border-violet-500/30 bg-violet-950/25 px-4 py-2.5 text-xs text-[#fafafa] max-w-[90%] sm:max-w-[80%] shadow-glass">
                  {current.user}
                </div>
              </div>

              {/* Friday AI response with layout-contained typewriter text */}
              <div className="flex flex-col items-start">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 mb-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Friday AI
                </span>
                <div
                  className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 px-4 py-3 text-xs text-[#f0f9ff] leading-relaxed max-w-[92%] sm:max-w-[85%] shadow-glass min-h-[72px]"
                  style={{ contain: 'layout paint' }}
                >
                  <p className="whitespace-pre-wrap">
                    {current.ai.slice(0, typedChars)}
                    {typedChars < current.ai.length && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-label */}
            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-[#737373]">
              <span>Type @friday or /help in any project chat</span>
              <span className="text-brand-yellow">Responses stream in real-time</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ChatDemo;
