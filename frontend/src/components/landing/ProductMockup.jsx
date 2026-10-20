import { useEffect, useState, useRef } from 'react';

export const ProductMockup = () => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Visibility API pause
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // IntersectionObserver pause when offscreen
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

  const floatingAnimStyle = isPaused ? { animationPlayState: 'paused' } : undefined;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl">
      {/* Floating Pill: Online Presence (Top-right) */}
      <div
        className="absolute -top-3.5 right-6 z-20 hidden sm:flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-mono text-[#fafafa] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        style={{
          transform: 'translateY(0)',
          ...floatingAnimStyle,
        }}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-[#a3a3a3]">Room Presence:</span>
        <span className="text-white font-semibold tabular-nums">2 members online</span>
      </div>

      {/* Floating Pill: Cloud Sync Status (Bottom-left) */}
      <div
        className="absolute -bottom-3.5 left-6 z-20 hidden sm:flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-mono text-[#fafafa] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        style={{
          transform: 'translateY(0)',
          ...floatingAnimStyle,
        }}
      >
        <i className="ri-check-line text-emerald-400 text-xs" />
        <span className="text-[#a3a3a3]">Status:</span>
        <span className="text-emerald-300 font-medium">Saved to Cloud</span>
      </div>

      {/* Glass Window Container */}
      <div className="relative rounded-2xl glass-strong border border-white/[0.22] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.04)]">
        {/* Window Title Bar */}
        <div className="flex h-11 items-center justify-between border-b border-white/[0.10] bg-[#0c0e16]/90 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]/90" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/90" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]/90" />
            </div>
            <span className="ml-3 font-mono text-xs text-[#a3a3a3] flex items-center gap-1.5">
              <i className="ri-folder-3-line text-cyan-400 text-xs" />
              <span>volaitile-friday / auth-service</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              gemini-2.5-flash-lite
            </span>
          </div>
        </div>

        {/* Window Content: 3-Column IDE Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-[#05060a]/90 text-xs">
          {/* Column 1: File Tree (3 cols on md) */}
          <div className="hidden md:flex md:col-span-3 flex-col border-r border-white/[0.08] bg-[#080a10]/85 p-3 select-none">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#737373] mb-2 px-1 flex items-center justify-between">
              <span>EXPLORER</span>
              <span className="text-[9px] text-white/30 tabular-nums">4 files</span>
            </div>
            <ul className="space-y-1 font-mono text-[11px]">
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-white/[0.04] cursor-pointer">
                <i className="ri-folder-line text-cyan-400/70" />
                <span>routes/</span>
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-white/[0.04] cursor-pointer pl-4">
                <i className="ri-file-code-line text-cyan-400/90" />
                <span>ai.routes.js</span>
              </li>
              <li className="flex items-center justify-between px-2 py-1.5 rounded-lg glass text-cyan-300 font-semibold border-cyan-400/40">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-file-code-line text-cyan-400" />
                  <span className="truncate">auth.middleware.js</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-white/[0.04] cursor-pointer">
                <i className="ri-markdown-line text-amber-400/80" />
                <span>README.md</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Code Editor (5 cols on md) */}
          <div className="md:col-span-5 flex flex-col border-r border-white/[0.08] bg-[#07090e]/95">
            <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-[#0c0e14]/90 px-3 text-[11px] font-mono">
              <span className="text-[#fafafa] flex items-center gap-1.5">
                <i className="ri-javascript-line text-amber-400" />
                auth.middleware.js
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <i className="ri-check-line" /> Saved
              </span>
            </div>
            <div className="p-3 font-mono text-[11px] leading-relaxed text-[#d4d4d4] overflow-x-auto select-none">
              <pre className="space-y-0.5">
                <code>
                  <span className="text-[#737373]">1</span>  <span className="text-purple-400">import</span> jwt <span className="text-purple-400">from</span> <span className="text-emerald-300">&apos;jsonwebtoken&apos;</span>;{'\n'}
                  <span className="text-[#737373]">2</span>  <span className="text-purple-400">import</span> redis <span className="text-purple-400">from</span> <span className="text-emerald-300">&apos;../service/cache.js&apos;</span>;{'\n'}
                  <span className="text-[#737373]">3</span>{'\n'}
                  <span className="text-[#737373]">4</span>  <span className="text-cyan-400">export const</span> <span className="text-yellow-300">authUser</span> = <span className="text-purple-400">async</span> (req, res, next) =&gt; &#123;{'\n'}
                  <span className="text-[#737373]">5</span>    <span className="text-purple-400">const</span> token = req.cookies.token;{'\n'}
                  <span className="text-[#737373]">6</span>    <span className="text-purple-400">if</span> (!token) <span className="text-purple-400">return</span> res.status(<span className="text-orange-300">401</span>).json(&#123; error: <span className="text-emerald-300">&apos;Unauthorized&apos;</span> &#125;);{'\n'}
                  <span className="text-[#737373]">7</span>{'\n'}
                  <span className="text-[#737373]">8</span>    <span className="text-purple-400">const</span> isBlacklisted = <span className="text-purple-400">await</span> redis.get(`blacklist:$&#123;token&#125;`);{'\n'}
                  <span className="text-[#737373]">9</span>    <span className="text-purple-400">if</span> (isBlacklisted) <span className="text-purple-400">return</span> res.status(<span className="text-orange-300">401</span>).end();{'\n'}
                  <span className="text-[#737373]">10</span>   req.user = jwt.verify(token, process.env.JWT_SECRET);{'\n'}
                  <span className="text-[#737373]">11</span>   next();{'\n'}
                  <span className="text-[#737373]">12</span> &#125;;
                </code>
              </pre>
            </div>
          </div>

          {/* Column 3: Live Chat with @friday (4 cols on md) */}
          <div className="md:col-span-4 flex flex-col bg-[#06080e]/90 p-3 select-none">
            <div className="flex h-8 items-center justify-between border-b border-white/[0.08] pb-2 text-[11px] font-mono">
              <span className="text-[#fafafa] flex items-center gap-1.5 font-semibold">
                <i className="ri-chat-3-line text-cyan-400" />
                Room Chat
              </span>
              <span className="text-[10px] text-cyan-300">Socket.IO Live</span>
            </div>

            <div className="flex-1 py-3 space-y-3">
              {/* User message */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-[#a3a3a3] mb-1">dev@company.com</span>
                <div className="rounded-2xl border border-violet-500/30 bg-violet-950/30 px-3 py-2 text-[11px] text-white">
                  @friday check our JWT blacklist lookup in auth.middleware.js
                </div>
              </div>

              {/* Friday AI response */}
              <div className="flex flex-col items-start">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 mb-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                  Friday AI · Gemini
                </span>
                <div className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 px-3 py-2 text-[11px] text-[#f0f9ff] leading-relaxed">
                  The Redis check is secure! Token invalidation operates in O(1) time. Remember to set a matching TTL on the blacklist key to prevent stale keys.
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-2 rounded-xl glass-input px-3 py-1.5">
                <input
                  type="text"
                  readOnly
                  value="Type a message or @friday..."
                  className="w-full bg-transparent text-[11px] text-[#737373] outline-none"
                  aria-label="Mock chat message input"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="h-6 w-6 rounded-lg bg-cyan-400 text-black flex items-center justify-center text-xs"
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
