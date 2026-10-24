import { useEffect, useState, useRef } from 'react';

export const ProductMockup = () => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const cardRef = useRef(null);

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

  useEffect(() => {
    // Pointer tilt: max 5deg rotateX/rotateY, perspective 1200px via rAF + lerp
    // strictly active only for (hover: hover) and (pointer: fine)
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const canHoverFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!canHoverFine.matches || prefersReducedMotion.matches) return;

    let animId = 0;
    let isHovered = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastTime = 0;
    let rect = null;

    function loop(now) {
      if (!lastTime) lastTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // dt-based exponential smoothing for uniform speed at 60/120/144Hz
      const blend = 1 - Math.exp(-12 * dt);
      currentX += (targetX - currentX) * blend;
      currentY += (targetY - currentY) * blend;

      card.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;

      if (isHovered || Math.abs(currentX) > 0.01 || Math.abs(currentY) > 0.01) {
        animId = requestAnimationFrame(loop);
      } else {
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
        card.style.willChange = 'auto';
        animId = 0;
      }
    }

    function onPointerEnter() {
      if (prefersReducedMotion.matches) return;
      isHovered = true;
      // Read bounding rect once on enter, NOT inside rAF loop (no layout reads inside animation loop rule)
      rect = container.getBoundingClientRect();
      card.style.willChange = 'transform';
      lastTime = performance.now();
      if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    }

    function onPointerMove(e) {
      if (!isHovered || !rect) return;
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      // Max 5deg tilt (normalized -0.5..0.5 * 10 = -5..5 deg)
      targetX = -normY * 10;
      targetY = normX * 10;
    }

    function onPointerLeave() {
      isHovered = false;
      targetX = 0;
      targetY = 0;
      rect = null;
      if (!animId) {
        lastTime = performance.now();
        animId = requestAnimationFrame(loop);
      }
    }

    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      if (animId) cancelAnimationFrame(animId);
      card.style.transform = '';
      card.style.willChange = 'auto';
    };
  }, []);

  const floatingAnimStyle = isPaused ? { animationPlayState: 'paused' } : undefined;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl">
      {/* Floating Pill: Online Presence (Top-right) */}
      <div
        className="absolute -top-3.5 right-6 z-20 hidden sm:flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-mono text-[#f3e6da] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)] animate-float-pill-1"
        style={floatingAnimStyle}
      >
        <span className="presence-dot h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
        <span className="text-[#a89384]">Room:</span>
        <span className="text-white font-semibold tabular-nums">1 member online</span>
      </div>

      {/* Floating Pill: Cloud Sync Status (Bottom-left) */}
      <div
        className="absolute -bottom-3.5 left-6 z-20 hidden sm:flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-mono text-[#f3e6da] border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.6)] animate-float-pill-2"
        style={floatingAnimStyle}
      >
        <i className="ri-check-line text-[#c4b5a8] text-xs" />
        <span className="text-[#a89384]">Status:</span>
        <span className="text-[#c4b5a8] font-medium">Saved</span>
      </div>

      {/* Glass Window Container with 3D Tilt */}
      <div
        ref={cardRef}
        className="relative rounded-2xl glass-strong border border-white/[0.22] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.04)] transition-transform duration-75 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Window Title Bar */}
        <div className="flex h-11 items-center justify-between border-b border-white/[0.10] bg-raised/90 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {/* macOS window dots -> accent palette */}
              <span className="h-3 w-3 rounded-full bg-accent/90" />
              <span className="h-3 w-3 rounded-full bg-[#a89384]/90" />
              <span className="h-3 w-3 rounded-full bg-[#c4b5a8]/90" />
            </div>
            <span className="ml-3 font-mono text-xs text-[#a89384] flex items-center gap-1.5">
              <i className="ri-folder-3-line text-accent text-xs" />
              <span>volaitile-friday / auth-service</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-[#c4b5a8]">
              gemini-2.5-flash-lite
            </span>
          </div>
        </div>

        {/* Window Content: 3-Column IDE Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-page/95 text-xs">
          {/* Column 1: File Tree (3 cols on md) */}
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

          {/* Column 2: Code Editor (5 cols on md) */}
          <div className="md:col-span-5 flex flex-col border-r border-white/[0.08] bg-surface/95">
            <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-raised/90 px-3 text-[11px] font-mono">
              <span className="text-[#f3e6da] flex items-center gap-1.5">
                <i className="ri-javascript-line text-accent-hover" />
                auth.middleware.js
              </span>
              <span className="text-[10px] text-[#c4b5a8] flex items-center gap-1">
                <i className="ri-check-line" /> Saved
              </span>
            </div>
            <div className="p-3 font-mono text-[11px] leading-relaxed text-[#c4b5a8] overflow-x-auto select-none">
              <pre className="space-y-0.5">
                <code>
                  {/* Syntax: keyword=accent, string=#c4b5a8, function=#f3e6da, number/comment=#6e5d50 */}
                  <span className="text-[#6e5d50]">1</span>  <span className="text-accent">import</span> jwt <span className="text-accent">from</span> <span className="text-[#c4b5a8]">&apos;jsonwebtoken&apos;</span>;{'\n'}
                  <span className="text-[#6e5d50]">2</span>  <span className="text-accent">import</span> redis <span className="text-accent">from</span> <span className="text-[#c4b5a8]">&apos;../service/cache.js&apos;</span>;{'\n'}
                  <span className="text-[#6e5d50]">3</span>{'\n'}
                  <span className="text-[#6e5d50]">4</span>  <span className="text-accent">export const</span> <span className="text-[#f3e6da]">authUser</span> = <span className="text-accent">async</span> (req, res, next) =&gt; &#123;{'\n'}
                  <span className="text-[#6e5d50]">5</span>    <span className="text-accent">const</span> token = req.cookies.token;{'\n'}
                  <span className="text-[#6e5d50]">6</span>    <span className="text-accent">if</span> (!token) <span className="text-accent">return</span> res.status(<span className="text-[#6e5d50]">401</span>).json(&#123; error: <span className="text-[#c4b5a8]">&apos;Unauthorized&apos;</span> &#125;);{'\n'}
                  <span className="text-[#6e5d50]">7</span>{'\n'}
                  <span className="text-[#6e5d50]">8</span>    <span className="text-accent">const</span> isBlacklisted = <span className="text-accent">await</span> redis.get(`blacklist:$&#123;token&#125;`);{'\n'}
                  <span className="text-[#6e5d50]">9</span>    <span className="text-accent">if</span> (isBlacklisted) <span className="text-accent">return</span> res.status(<span className="text-[#6e5d50]">401</span>).end();{'\n'}
                  <span className="text-[#6e5d50]">10</span>   req.user = jwt.verify(token, process.env.JWT_SECRET);{'\n'}
                  <span className="text-[#6e5d50]">11</span>   next();{'\n'}
                  <span className="text-[#6e5d50]">12</span> &#125;;
                </code>
              </pre>
            </div>
          </div>

          {/* Column 3: Live Chat with @friday (4 cols on md) */}
          <div className="md:col-span-4 flex flex-col bg-surface/90 p-3 select-none">
            <div className="flex h-8 items-center justify-between border-b border-white/[0.08] pb-2 text-[11px] font-mono">
              <span className="text-[#f3e6da] flex items-center gap-1.5 font-semibold">
                <i className="ri-chat-3-line text-accent" />
                Room Chat
              </span>
              <span className="text-[10px] text-[#c4b5a8]">Socket.IO Live</span>
            </div>

            <div className="flex-1 py-3 space-y-3">
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
                  Friday AI · Gemini
                </span>
                <div className="rounded-2xl border border-accent-deep bg-accent-tint/20 px-3 py-2 text-[11px] text-[#c4b5a8] leading-relaxed">
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
