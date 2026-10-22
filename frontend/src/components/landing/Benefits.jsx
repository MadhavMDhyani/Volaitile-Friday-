import Reveal from './Reveal';

export const Benefits = () => {
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
    <section id="benefits" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              THE WORKSPACE ADVANTAGE
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa] leading-tight">
              Why engineering teams build on Volaitile Friday
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#a3a3a3] leading-relaxed">
              Designed to eliminate developer friction and keep your entire team aligned inside one high-speed workspace.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => (
            <Reveal
              key={b.title}
              delay={idx * 80}
              transformOnly={true}
              className={idx === 0 ? 'lg:col-span-2' : ''}
            >
              <div className="h-full rounded-2xl glass p-7 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl glass border-white/10 text-accent">
                      <i className={`${b.icon} text-lg`} />
                    </div>
                    <span className="text-[10px] font-mono text-[#a3a3a3] border border-white/10 rounded-full px-2.5 py-0.5 bg-white/[0.04]">
                      {b.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#fafafa]">
                    {b.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[#a3a3a3] leading-relaxed">
                    {b.desc}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/[0.08] pt-3 flex items-center text-[11px] font-mono text-accent">
                  <span>Built for developers</span>
                  <i className="ri-arrow-right-s-line text-sm ml-1" />
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
