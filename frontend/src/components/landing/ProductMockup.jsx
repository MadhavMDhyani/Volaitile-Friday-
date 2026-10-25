import { useEffect, useState, useRef } from 'react';

export const ProductMockup = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('code'); // 'code' | 'chat'
  const containerRef = useRef(null);

  useEffect(() => {
    // Visibility API pause
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // IntersectionObserver pause when offscreen
    let observer;
    const node = containerRef.current;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && node) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsPaused(!entry.isIntersecting);
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer && node) {
        observer.unobserve(node);
      }
    };
  }, []);

  const floatingAnimStyle = isPaused ? { animationPlayState: 'paused' } : undefined;

  const codeLines = [
    { num: 1, content: <> <span className="text-accent">import</span> jwt <span className="text-accent">from</span> <span className="text-[#c4b5a8]">&apos;jsonwebtoken&apos;</span>;</> },
    { num: 2, content: <> <span className="text-accent">import</span> redisService <span className="text-accent">from</span> <span className="text-[#c4b5a8]">&apos;../service/redis.service.js&apos;</span>;</> },
    { num: 3, content: <>&nbsp;</> },
    { num: 4, content: <> <span className="text-accent">export const</span> <span className="text-[#f3e6da]">authUser</span> = <span className="text-accent">async</span> (req, res, next) =&gt; &#123;</> },
    { num: 5, content: <>   <span className="text-accent">try</span> &#123;</> },
    { num: 6, content: <>     <span className="text-accent">const</span> token = extractToken(req);</> },
    { num: 7, content: <>     <span className="text-accent">if</span> (!token) <span className="text-accent">return</span> res.status(<span className="text-[#6e5d50]">401</span>).json(&#123; error: <span className="text-[#c4b5a8]">&apos;Unauthorized&apos;</span> &#125;);</> },
    { num: 8, content: <>&nbsp;</> },
    { num: 9, content: <>     <span className="text-accent">const</span> isBlacklisted = <span className="text-accent">await</span> redisService.get(token);</> },
    { num: 10, content: <>     <span className="text-accent">if</span> (isBlacklisted) <span className="text-accent">return</span> res.status(<span className="text-[#6e5d50]">401</span>).json(&#123; error: <span className="text-[#c4b5a8]">&apos;Unauthorized&apos;</span> &#125;);</> },
    { num: 11, content: <>&nbsp;</> },
    { num: 12, content: <>     req.user = jwt.verify(token, process.env.JWT_SECRET);</> },
    { num: 13, content: <>     <span className="text-accent">return</span> next();</> },
    { num: 14, content: <>   &#125; <span className="text-accent">catch</span> (err) &#123;</> },
    { num: 15, content: <>     <span className="text-accent">return</span> res.status(<span className="text-[#6e5d50]">401</span>).json(&#123; error: <span className="text-[#c4b5a8]">&apos;Unauthorized&apos;</span> &#125;);</> },
    { num: 16, content: <>   &#125;</> },
    { num: 17, content: <> &#125;;</> },
  ];

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl text-left">
      {/* Floating Pill: Online Presence (Top-left, non-overlapping with top-right chip) */}
      <div
        className="absolute -top-3.5 left-4 sm:left-8 z-20 flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] sm:text-[11px] font-mono text-[#f3e6da] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)] max-w-[calc(100%-2rem)]"
        style={{
          transform: 'translateY(0)',
          ...floatingAnimStyle,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.8)]" />
        <span className="text-[#a89384]">Room Presence:</span>
        <span className="text-white font-semibold tabular-nums">2 online</span>
      </div>

      {/* Floating Pill: Cloud Sync Status (Bottom-right, stays within mobile viewport) */}
      <div
        className="absolute -bottom-3.5 right-4 sm:right-8 z-20 flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] sm:text-[11px] font-mono text-[#f3e6da] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)] max-w-[calc(100%-2rem)]"
        style={{
          transform: 'translateY(0)',
          ...floatingAnimStyle,
        }}
      >
        <i className="ri-check-line text-[#c4b5a8] text-xs" />
        <span className="text-[#a89384]">Status:</span>
        <span className="text-[#c4b5a8] font-medium">Saved to Cloud</span>
      </div>

      {/* Glass Window Container */}
      <div className="relative rounded-2xl glass-strong border border-white/[0.22] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.04)]">
        {/* Window Title Bar */}
        <div className="flex h-11 items-center justify-between border-b border-white/[0.10] bg-raised/90 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 rounded-full bg-accent/90" />
              <span className="h-3 w-3 rounded-full bg-[#a89384]/90" />
              <span className="h-3 w-3 rounded-full bg-[#c4b5a8]/90" />
            </div>
            <span className="ml-3 font-mono text-xs text-[#a89384] flex items-center gap-1.5 truncate">
              <i className="ri-folder-3-line text-accent text-xs shrink-0" />
              <span className="truncate">volaitile-friday / auth-service</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-[#c4b5a8]">
              Friday AI · Auto
            </span>
          </div>
        </div>

        {/* Mobile Tab Switcher (<768px) */}
        <div className="flex md:hidden items-center border-b border-white/[0.08] bg-raised/80 px-3 py-1.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveMobileTab('code')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMobileTab === 'code'
                ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                : 'text-[#a89384] hover:text-white'
            }`}
          >
            <i className="ri-code-s-slash-line text-xs" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('chat')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMobileTab === 'chat'
                ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
                : 'text-[#a89384] hover:text-white'
            }`}
          >
            <i className="ri-chat-3-line text-xs" />
            <span>Chat</span>
          </button>
        </div>

        {/* Window Content: 3-Column IDE Layout capped on mobile with internal scroll */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[420px] md:max-h-none min-h-[360px] md:min-h-[380px] bg-page/95 text-xs overflow-y-auto md:overflow-visible">
          {/* Column 1: File Tree (hidden below 768px, 3 cols on md) */}
          <div className="hidden md:flex md:col-span-3 flex-col border-r border-white/[0.08] bg-page/85 p-3 select-none">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6e5d50] mb-2 px-1 flex items-center justify-between">
              <span>EXPLORER</span>
              <span className="text-[9px] text-white/30 tabular-nums">4 files</span>
            </div>
            <ul className="space-y-1 font-mono text-[11px]">
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a89384] hover:text-white hover:bg-white/[0.04] cursor-pointer">
                <i className="ri-folder-line text-accent/70" />
                <span>routes/</span>
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a89384] hover:text-white hover:bg-white/[0.04] cursor-pointer pl-4">
                <i className="ri-file-code-line text-accent/90" />
                <span>ai.routes.js</span>
              </li>
              <li className="flex items-center justify-between px-2 py-1.5 rounded-lg glass text-accent font-semibold border-accent/40">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-file-code-line text-accent" />
                  <span className="truncate">auth.middleware.js</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a89384] hover:text-white hover:bg-white/[0.04] cursor-pointer">
                <i className="ri-markdown-line text-accent-hover/80" />
                <span>README.md</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Code Editor (shown if code tab active on mobile, 5 cols on md) */}
          <div
            className={`${
              activeMobileTab === 'code' ? 'flex' : 'hidden'
            } md:flex md:col-span-5 flex-col border-r border-white/[0.08] bg-surface/95 min-h-0`}
          >
            <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-raised/90 px-3 text-[11px] font-mono shrink-0">
              <span className="text-[#f3e6da] flex items-center gap-1.5">
                <i className="ri-javascript-line text-accent-hover" />
                auth.middleware.js
              </span>
              <span className="text-[10px] text-[#c4b5a8] flex items-center gap-1">
                <i className="ri-check-line" /> Saved
              </span>
            </div>
            <div className="p-3 font-mono text-[11px] leading-relaxed text-[#c4b5a8] overflow-auto select-none flex-1">
              <div className="space-y-0.5">
                {codeLines.map((line) => (
                  <div key={line.num} className="flex items-start">
                    <span className="w-7 shrink-0 text-right pr-3 select-none text-[#6e5d50] font-mono tabular-nums">
                      {line.num}
                    </span>
                    <span className="flex-1 whitespace-pre">
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Live Chat with Friday AI (shown if chat tab active on mobile, 4 cols on md) */}
          <div
            className={`${
              activeMobileTab === 'chat' ? 'flex' : 'hidden'
            } md:flex md:col-span-4 flex-col bg-surface/90 p-3 select-none min-h-0 justify-between`}
          >
            <div>
              <div className="flex h-8 items-center justify-between border-b border-white/[0.08] pb-2 text-[11px] font-mono">
                <span className="text-[#f3e6da] flex items-center gap-1.5 font-semibold">
                  <i className="ri-chat-3-line text-accent" />
                  Room Chat
                </span>
                <span className="text-[10px] text-[#c4b5a8]">Socket.IO Live</span>
              </div>

              <div className="py-3 space-y-3 overflow-y-auto max-h-[260px] md:max-h-none">
                {/* User message */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-[#a89384] mb-1">dev@company.com</span>
                  <div className="rounded-2xl border border-accent-press/30 bg-accent-tint/25 px-3 py-2 text-[11px] text-white">
                    @friday check our JWT blacklist lookup in auth.middleware.js
                  </div>
                </div>

                {/* Friday AI response */}
                <div className="flex flex-col items-start">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-accent mb-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)]" />
                    Friday AI · Auto
                  </span>
                  <div className="rounded-2xl border border-accent-deep bg-accent-tint/20 px-3 py-2 text-[11px] text-[#c4b5a8] leading-relaxed">
                    The Redis check is secure! Token invalidation operates in O(1) time. Remember to set a matching TTL on the blacklist key to prevent stale keys.
                  </div>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="pt-2 border-t border-white/[0.08] mt-2">
              <div className="flex items-center gap-2 rounded-xl glass-input px-3 py-1.5">
                <input
                  type="text"
                  readOnly
                  value="Type a message or @friday..."
                  className="w-full bg-transparent text-[11px] text-[#6e5d50] outline-none"
                  aria-label="Mock chat message input"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="h-6 w-6 rounded-lg bg-accent text-[#140d09] flex items-center justify-center text-xs"
                  aria-label="Mock send"
                >
                  <i className="ri-send-plane-2-fill text-[10px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMockup;
