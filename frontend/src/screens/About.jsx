import InfoPageLayout from '../components/landing/InfoPageLayout';
import Reveal from '../components/landing/Reveal';
import usePageMeta from '../hooks/usePageMeta';

export const About = () => {
  usePageMeta({
    title: 'About',
    description:
      'Learn about Volaitile Friday: an engineering workspace uniting cloud file editing, live team chat, and Friday AI into one synchronized canvas.',
  });

  const pillars = [
    {
      title: 'Shared Workspace',
      badge: 'COLLABORATION',
      icon: 'ri-folder-code-line',
      desc: 'An in-browser code editor with a multi-file project tree, live team presence indicators, and instant workspace synchronization. No local setup bottlenecks or conflicting branch states.',
    },
    {
      title: 'Live Team Chat',
      badge: 'COMMUNICATION',
      icon: 'ri-message-3-line',
      desc: 'Room-scoped discussions powered by Socket.IO with typing indicators and real-time message broadcasting. Keep architecture debates and peer reviews right beside the relevant source code.',
    },
    {
      title: 'Friday AI Assistant',
      badge: 'INTELLIGENCE',
      icon: 'ri-robot-2-line',
      desc: 'An AI engineering copilot powered by Google Gemini. Use @friday or built-in slash commands (/auth, /db, /docker, /test) with automatic offline engine fallback when external connections drop.',
    },
  ];

  const techStack = [
    { name: 'React 19', role: 'Concurrent UI framework' },
    { name: 'Vite', role: 'Modern frontend tooling' },
    { name: 'Tailwind CSS', role: 'Design token styling' },
    { name: 'Node.js (ESM)', role: 'Modular runtime' },
    { name: 'Express', role: 'RESTful API server' },
    { name: 'Socket.IO', role: 'Real-time WebSocket protocol' },
    { name: 'MongoDB', role: 'NoSQL document datastore' },
    { name: 'Redis (optional)', role: 'Token denylist & cache' },
    { name: 'Google Gemini', role: 'Multimodal AI intelligence' },
  ];

  return (
    <InfoPageLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero Pitch */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              ABOUT VOLAITILE FRIDAY
            </span>
            <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-[#f3e6da] leading-tight">
              An engineering workspace built for flow
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#a89384] leading-relaxed">
              Volaitile Friday eliminates the constant context-switching between separate code editors, external team chat windows, and AI browser tabs. We bring live code, real-time teammates, and project-aware AI together on a single canvas.
            </p>
          </Reveal>
        </div>

        {/* Three Pillars */}
        <div className="mb-16">
          <Reveal delay={60}>
            <div className="text-center mb-10">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
                CORE ARCHITECTURE
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#f3e6da]">
                The Three Pillars
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => (
              <Reveal key={pillar.title} delay={idx * 80} transformOnly={true}>
                <div className="h-full rounded-2xl glass p-6 sm:p-7 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl glass border-accent/30 text-accent shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
                        <i className={`${pillar.icon} text-xl`} />
                      </div>
                      <span className="text-[10px] font-mono rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#a89384]">
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#f3e6da]">{pillar.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Who It's For */}
        <div className="mb-16">
          <Reveal delay={80}>
            <div className="rounded-2xl glass-strong border border-white/10 p-6 sm:p-10">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
                AUDIENCE &amp; FIT
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#f3e6da]">
                Who is Volaitile Friday for?
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-[#a89384] leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-accent shrink-0 mt-0.5">
                    <i className="ri-team-line text-base" />
                  </div>
                  <div>
                    <strong className="text-[#f3e6da] block mb-1">Engineering Teams</strong>
                    Pair-program on critical services, debug production incidents collaboratively, and keep conversational context attached to the codebase.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-accent shrink-0 mt-0.5">
                    <i className="ri-flashlight-line text-base" />
                  </div>
                  <div>
                    <strong className="text-[#f3e6da] block mb-1">Hackathons &amp; Prototyping</strong>
                    Start coding instantly with zero environment setup or configuration hurdles. Spin up projects and collaborate from minute zero.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-accent shrink-0 mt-0.5">
                    <i className="ri-book-read-line text-base" />
                  </div>
                  <div>
                    <strong className="text-[#f3e6da] block mb-1">Student &amp; Study Groups</strong>
                    Review algorithms and build coursework together in a shared room without screen-sharing latency or audio desync.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg glass text-accent shrink-0 mt-0.5">
                    <i className="ri-server-line text-base" />
                  </div>
                  <div>
                    <strong className="text-[#f3e6da] block mb-1">Self-Hosters &amp; Privacy-Conscious</strong>
                    Deploy the full environment on private hardware or cloud instances using Docker Compose with complete sovereignty over your code.
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Built With */}
        <div>
          <Reveal delay={100}>
            <div className="text-center mb-8">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
                TECH STACK
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#f3e6da]">
                Built with modern, open standards
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="rounded-xl glass border border-white/[0.08] p-3.5 text-center sm:text-left flex flex-col justify-center"
                >
                  <span className="font-mono text-xs font-semibold text-[#f3e6da]">
                    {tech.name}
                  </span>
                  <span className="text-[11px] text-[#a89384] mt-0.5">{tech.role}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default About;
