import Reveal from './Reveal';

const PILLARS = [
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

const AUDIENCE_ITEMS = [
  {
    title: 'Engineering Teams',
    icon: 'ri-team-line',
    desc: 'Pair-program on critical services, debug production incidents collaboratively, and keep conversational context attached to the codebase.',
  },
  {
    title: 'Hackathons & Prototyping',
    icon: 'ri-flashlight-line',
    desc: 'Start coding instantly with zero environment setup or configuration hurdles. Spin up projects and collaborate from minute zero.',
  },
  {
    title: 'Student & Study Groups',
    icon: 'ri-book-read-line',
    desc: 'Review algorithms and build coursework together in a shared room without screen-sharing latency or audio desync.',
  },
  {
    title: 'Self-Hosters & Privacy-Conscious',
    icon: 'ri-server-line',
    desc: 'Deploy the full environment on private hardware or cloud instances using Docker Compose with complete sovereignty over your code.',
  },
];

const TECH_STACK = [
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

export const AboutSection = ({ compact = false, asH1 = false }) => {
  const TitleTag = asH1 ? 'h1' : 'h2';

  return (
    <div className={compact ? 'space-y-6' : 'space-y-12'}>
      {/* Pitch Header */}
      <div>
        <Reveal delay={0} immediate={compact}>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
            ABOUT VOLAITILE FRIDAY
          </span>
          <TitleTag className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3FF] leading-tight">
            An engineering workspace built for flow
          </TitleTag>
          <p className="mt-3 text-xs sm:text-sm text-[#9D98AA] leading-relaxed">
            Volaitile Friday eliminates the constant context-switching between separate code editors, external team chat windows, and AI browser tabs. We bring live code, real-time teammates, and project-aware AI together on a single canvas.
          </p>
        </Reveal>
      </div>

      {/* Three Pillars */}
      <div>
        <Reveal delay={40} immediate={compact}>
          <div className="mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              CORE ARCHITECTURE
            </span>
            <h3 className="text-lg font-bold tracking-tight text-[#F5F3FF]">
              The Three Pillars
            </h3>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {PILLARS.map((pillar, idx) => (
            <Reveal key={pillar.title} delay={idx * 60} immediate={compact} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-4 sm:p-5 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl glass border-accent/30 text-accent shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
                      <i className={`${pillar.icon} text-lg`} />
                    </div>
                    <span className="text-[10px] font-mono rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[#9D98AA]">
                      {pillar.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F3FF]">{pillar.title}</h4>
                  <p className="mt-1.5 text-xs text-[#9D98AA] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Audience & Fit */}
      <div>
        <Reveal delay={80} immediate={compact}>
          <div className="rounded-2xl glass-strong border border-white/10 p-5 sm:p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              AUDIENCE &amp; FIT
            </span>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-[#F5F3FF]">
              Who is Volaitile Friday for?
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#9D98AA] leading-relaxed">
              {AUDIENCE_ITEMS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg glass text-accent shrink-0 mt-0.5">
                    <i className={`${item.icon} text-sm`} />
                  </div>
                  <div>
                    <strong className="text-[#F5F3FF] block mb-0.5">{item.title}</strong>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Tech Stack */}
      <div>
        <Reveal delay={100} immediate={compact}>
          <div className="mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              TECH STACK
            </span>
            <h3 className="text-lg font-bold tracking-tight text-[#F5F3FF]">
              Built with modern, open standards
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="rounded-xl glass border border-white/[0.08] p-3 text-left flex flex-col justify-center"
              >
                <span className="font-mono text-xs font-semibold text-[#F5F3FF]">
                  {tech.name}
                </span>
                <span className="text-[10px] text-[#9D98AA] mt-0.5">{tech.role}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default AboutSection;
