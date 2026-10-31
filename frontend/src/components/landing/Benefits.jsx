import Reveal from './Reveal';

export const Benefits = ({ asH1 = false, isPage = false, compact = false }) => {
  const TitleTag = asH1 ? 'h1' : 'h2';
  const benefits = [
    {
      title: 'Stop losing focus between tabs',
      desc: 'No more jumping between an external chat app, a separate web IDE, and browser tabs with AI chats. Code editing, live team conversations, and Friday AI sit side-by-side in one focused screen.',
      icon: 'ri-layout-masonry-line',
      badge: 'Unified Workspace',
    },
    {
      title: 'AI that speaks your codebase',
      desc: 'Ask Friday about specific middleware, API contracts, or Docker configs. The assistant operates directly within the context of your project files for actionable, tailored answers.',
      icon: 'ri-sparkling-2-line',
      badge: 'Context-Aware',
    },
    {
      title: 'Instant team collaboration',
      desc: 'Create a workspace, search your teammate by email, and jump straight into coding. Socket.IO keeps all members in sync with presence and live room chat.',
      icon: 'ri-flashlight-line',
      badge: 'Zero Friction',
    },
    {
      title: 'Security by architecture, not afterthought',
      desc: 'Passwords hashed with bcrypt, API protected with strict rate limiting, and JWT tokens instantly invalidated in Redis on logout. Your project code stays strictly accessible only to authorized members.',
      icon: 'ri-shield-keyhole-line',
      badge: 'Hardened Security',
    },
    {
      title: 'Full sovereignty with Docker Compose',
      desc: 'Run your complete instance on your local machine, cloud VPS, or private data center with one command. Datastores remain strictly isolated on internal networks.',
      icon: 'ri-server-line',
      badge: 'Self-Hostable',
    },
  ];

  return (
    <section id="benefits" className={compact ? 'space-y-6' : `${isPage ? 'py-12 sm:py-16' : 'py-20 sm:py-28'} relative`}>
      <div className={compact ? 'w-full' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        <div className={compact ? 'mb-6 text-left' : 'text-center max-w-3xl mx-auto mb-16'}>
          <Reveal delay={0} immediate={compact}>
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-medium">
              THE WORKSPACE ADVANTAGE
            </span>
            <TitleTag className={`mt-2 font-medium tracking-tight text-white leading-tight ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
              Why Volaitile Friday
            </TitleTag>
            <p className="mt-3 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
              Designed to eliminate developer friction and keep your entire team aligned inside one high-speed workspace.
            </p>
          </Reveal>
        </div>

        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 gap-3.5' : 'md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
          {benefits.map((b, idx) => (
            <Reveal
              key={b.title}
              delay={idx * 80}
              immediate={compact}
              transformOnly={true}
              className={!compact && idx === 0 ? 'lg:col-span-2' : ''}
            >
              <div className={`h-full rounded-3xl tile ${compact ? 'p-4 sm:p-5' : 'p-7'} flex flex-col justify-start hover:border-white/30 transition-all duration-200`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl tile border-white/10 text-primary">
                      <i className={`${b.icon} text-base`} />
                    </div>
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.55)] border border-white/10 rounded-full px-2.5 py-0.5 bg-white/[0.04]">
                      {b.badge}
                    </span>
                  </div>

                  <h3 className={`font-medium tracking-tight text-white flex items-start ${compact ? 'text-base min-h-0' : 'text-lg min-h-[3.5rem]'}`}>
                    {b.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;

