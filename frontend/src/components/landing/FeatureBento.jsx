import Reveal from './Reveal';

export const FeatureBento = () => {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              ENGINEERED FOR TEAMS
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#f3e6da] leading-tight">
              A complete workspace without switching tabs
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#a89384] leading-relaxed">
              Every tool your team needs to collaborate on code, discuss architectures, and build faster with Friday AI.
            </p>
          </Reveal>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-5">
          {/* Card 1: Friday AI Assistant (Lg: 8 cols) */}
          <div className="md:col-span-3 lg:col-span-8">
            <Reveal delay={60} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-accent/30 text-accent shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
                      <i className="ri-robot-2-line text-xl" />
                    </div>
                    <span className="text-[10px] font-mono rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[#c4b5a8]">
                      Google Gemini + Offline Fallback
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#f3e6da]">
                    Context-Aware Friday AI Assistant
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Mention <span className="font-mono text-accent">@friday</span> or run built-in slash commands like <span className="font-mono text-[#f3e6da]">/auth</span>, <span className="font-mono text-[#f3e6da]">/db</span>, <span className="font-mono text-[#f3e6da]">/docker</span>, and <span className="font-mono text-[#f3e6da]">/test</span>. Choose between Fast, Balanced, and Deep models or rely on the offline intelligence engine if disconnected.
                  </p>
                </div>

                {/* Sub-card interactive visual snippet */}
                <div className="mt-6 rounded-xl border border-white/[0.08] bg-surface/80 p-3.5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-[10px] text-[#6e5d50]">
                    <span className="flex items-center gap-1.5 text-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                      POST /ai/chat
                    </span>
                    <span className="text-[9px] uppercase">Latency: 280ms</span>
                  </div>
                  <div className="pt-2 text-[11px] text-[#f3e6da] flex items-center justify-between">
                    <span className="text-[#a89384]">Models: Fast (2.5 Flash Lite) · Balanced · Deep</span>
                    <span className="text-accent font-medium">Rate limit: 20 req/min</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 2: Real-time Room Chat (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={120} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-white/20 text-[#c4b5a8] mb-4 shadow-[0_0_16px_rgba(255,255,255,0.06)]">
                    <i className="ri-chat-3-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Real-Time Room Chat
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Socket.IO room streaming with real-time typing indicators, live presence tracking, and optimistic message delivery.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-[#a89384] border-t border-white/[0.08] pt-3">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span>Sub-millisecond room broadcasts</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 3: Cloud File Workspace (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={180} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-accent-hover/30 text-accent-hover mb-4 shadow-[0_0_16px_rgba(207,78,36,0.2)]">
                    <i className="ri-file-code-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Browser File Workspace
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Create, rename, and edit project files directly in your browser. Features 1.2s debounced autosave, keyboard shortcuts (Ctrl+S), and conflict prevention.
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[#6e5d50] border-t border-white/[0.08] pt-3 flex items-center justify-between">
                  <span>Capacity: Up to 100 files</span>
                  <span>Max 200 KB/file</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 4: Team Management & Roles (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={240} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-accent/30 text-accent mb-4 shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
                    <i className="ri-team-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Team &amp; Access Controls
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Find and invite teammates via email prefix search. Strict project owner privileges safeguard deletion and membership rights (capped at 25 members).
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[#6e5d50] border-t border-white/[0.08] pt-3">
                  Compound index security: owner + name
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 5: Security by Default (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={300} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-white/20 text-[#c4b5a8] mb-4 shadow-[0_0_16px_rgba(255,255,255,0.05)]">
                    <i className="ri-shield-check-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Hardened Security by Default
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Strict JWT tokens, bcrypt hashed passwords, Redis session invalidation on logout, rate limiters on auth, and Helmet security headers.
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[#c4b5a8]/80 border-t border-white/[0.08] pt-3 flex items-center gap-1.5">
                  <i className="ri-lock-line" />
                  <span>Redis blacklist validation</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 6: Developer Utilities & Self-Hosting (Lg: 12 cols split) */}
          <div className="md:col-span-3 lg:col-span-6">
            <Reveal delay={360} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-accent/30 text-accent mb-4 shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
                    <i className="ri-tools-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Built-in Developer Utilities
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Generate cryptographically secure tokens with one click and validate JSON payloads directly in your workflow.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4 text-xs font-mono text-[#a89384] border-t border-white/[0.08] pt-3">
                  <span>/tools/generate-secret</span>
                  <span>/tools/validate-json</span>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-3 lg:col-span-6">
            <Reveal delay={420} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-6 sm:p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-white/20 text-white mb-4">
                    <i className="ri-server-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-[#f3e6da]">
                    Docker Compose &amp; Self-Host Ready
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                    Deploy anywhere with a single <code className="font-mono text-[#c4b5a8]">docker-compose up -d</code> command. Complete stack includes MongoDB 7, Redis 7, Node 20 backend, and Nginx Alpine frontend.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 text-xs font-mono text-white/60 border-t border-white/[0.08] pt-3">
                  <span>Internal private network</span>
                  <span>·</span>
                  <span>Multi-stage builds</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureBento;
