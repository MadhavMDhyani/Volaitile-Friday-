import Reveal from './Reveal';

export const FeatureBento = ({ asH1 = false, isPage = false, compact = false }) => {
  const TitleTag = asH1 ? 'h1' : 'h2';

  return (
    <section id="features" className={compact ? 'space-y-6' : `${isPage ? 'py-12 sm:py-16' : 'py-20 sm:py-28'} relative`}>
      <div className={compact ? 'w-full' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        {/* Section Header */}
        <div className={compact ? 'mb-6 text-left' : 'text-center max-w-3xl mx-auto mb-16'}>
          <Reveal delay={0} immediate={compact}>
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
              ENGINEERED FOR TEAMS
            </span>
            <TitleTag className={`mt-2 font-bold tracking-tight text-white leading-tight ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
              A complete workspace without switching tabs
            </TitleTag>
            <p className="mt-3 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
              Every tool your team needs to collaborate on code, discuss architectures, and build faster with Friday AI.
            </p>
          </Reveal>
        </div>

        {/* Bento Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 ${compact ? 'gap-3.5' : 'gap-5'}`}>
          {/* Card 1: Friday AI Assistant (Lg: 8 cols) */}
          <div className="md:col-span-3 lg:col-span-8">
            <Reveal delay={60} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-primary">
                      <i className="ri-robot-2-line text-xl" />
                    </div>
                    <span className="text-[10px] font-mono rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[rgba(255,255,255,0.70)]">
                      Google Gemini + Offline Fallback
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Context-Aware Friday AI Assistant
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Mention <span className="font-mono text-primary">@friday</span> or run built-in slash commands like <span className="font-mono text-white">/auth</span>, <span className="font-mono text-white">/db</span>, <span className="font-mono text-white">/docker</span>, and <span className="font-mono text-white">/test</span>. Choose between Fast, Balanced, and Deep models or rely on the offline intelligence engine if disconnected.
                  </p>
                </div>

                {/* Sub-card interactive visual snippet */}
                <div className="mt-6 rounded-xl tile-deep border-0 p-3.5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-[10px] text-[rgba(255,255,255,0.35)]">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      POST /ai/chat
                    </span>
                  </div>
                  <div className="pt-2 text-[11px] text-white flex items-center justify-between">
                    <span className="text-[rgba(255,255,255,0.55)]">Models: Fast · Balanced · Deep</span>
                    <span className="text-primary font-medium">Rate limit: 20 req/min</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 2: Real-time Room Chat (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={120} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-[rgba(255,255,255,0.70)] mb-4">
                    <i className="ri-chat-3-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Real-Time Room Chat
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Socket.IO room streaming with real-time typing indicators, live presence tracking, and optimistic message delivery.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-[rgba(255,255,255,0.55)] border-t border-white/[0.08] pt-3">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span>Live room broadcasts over Socket.IO</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 3: Cloud File Workspace (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={180} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-primary mb-4">
                    <i className="ri-file-code-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Browser File Workspace
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Create, rename, and edit project files directly in your browser. Features 1.2s debounced autosave, keyboard shortcuts (Ctrl+S), and conflict prevention.
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[rgba(255,255,255,0.35)] border-t border-white/[0.08] pt-3 flex items-center justify-between">
                  <span>Capacity: Up to 100 files</span>
                  <span>Max 200 KB/file</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 4: Team Management & Roles (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={240} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-primary mb-4">
                    <i className="ri-team-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Team &amp; Access Controls
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Find and invite teammates via email prefix search. Strict project owner privileges safeguard deletion and membership rights (capped at 25 members).
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[rgba(255,255,255,0.35)] border-t border-white/[0.08] pt-3">
                  Compound index security: owner + name
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 5: Security by Default (Lg: 4 cols) */}
          <div className="md:col-span-3 lg:col-span-4">
            <Reveal delay={300} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-[rgba(255,255,255,0.70)] mb-4">
                    <i className="ri-shield-check-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Hardened Security by Default
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Strict JWT tokens, bcrypt hashed passwords, Redis session invalidation on logout, rate limiters on auth, and Helmet security headers.
                  </p>
                </div>

                <div className="mt-6 text-[11px] font-mono text-[rgba(255,255,255,0.70)]/80 border-t border-white/[0.08] pt-3 flex items-center gap-1.5">
                  <i className="ri-lock-line" />
                  <span>Redis blacklist validation</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Card 6: Developer Utilities & Self-Hosting (Lg: 12 cols split) */}
          <div className="md:col-span-3 lg:col-span-6">
            <Reveal delay={360} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-primary mb-4">
                    <i className="ri-tools-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Built-in Developer Utilities
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Generate cryptographically secure tokens with one click and validate JSON payloads directly in your workflow.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4 text-xs font-mono text-[rgba(255,255,255,0.55)] border-t border-white/[0.08] pt-3">
                  <span>/tools/generate-secret</span>
                  <span>/tools/validate-json</span>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-3 lg:col-span-6">
            <Reveal delay={420} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tile-raised text-white mb-4">
                    <i className="ri-server-line text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Docker Compose &amp; Self-Host Ready
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    Deploy anywhere with a single <code className="font-mono text-[rgba(255,255,255,0.70)]">docker compose up -d</code> command. Complete stack includes MongoDB, Redis, Node 20 backend, and Nginx Alpine frontend.
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


