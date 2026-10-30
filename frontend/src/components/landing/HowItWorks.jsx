import Reveal from './Reveal';

export const HowItWorks = ({ asH1 = false, isPage = false, compact = false }) => {
  const TitleTag = asH1 ? 'h1' : 'h2';
  const steps = [
    {
      num: '01',
      title: 'Create a project',
      desc: 'Initialize an isolated workspace in seconds. Projects automatically track code lines, files, and members.',
      icon: 'ri-add-box-line',
    },
    {
      num: '02',
      title: 'Invite your team',
      desc: 'Search team members by email prefix to grant workspace access with clear owner and collaborator controls.',
      icon: 'ri-user-add-line',
    },
    {
      num: '03',
      title: 'Chat, code & ask Friday',
      desc: 'Edit files in real time, discuss ideas in room chat, and summon Friday AI for instant code review or generation.',
      icon: 'ri-terminal-box-line',
    },
  ];

  return (
    <section id="how-it-works" className={compact ? 'space-y-6' : `${isPage ? 'py-12 sm:py-16' : 'py-20 sm:py-28'} relative`}>
      <div className={compact ? 'w-full' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
        <div className={compact ? 'mb-6 text-left' : 'text-center max-w-3xl mx-auto mb-16'}>
          <Reveal delay={0} immediate={compact}>
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
              SIMPLE WORKFLOW
            </span>
            <TitleTag className={`mt-2 font-bold tracking-tight text-white leading-tight ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
              From zero to shipping in 3 steps
            </TitleTag>
            <p className="mt-3 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
              No complex pipeline setup or external plugins required. Everything is ready the moment you sign in.
            </p>
          </Reveal>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 ${compact ? 'gap-3.5' : 'gap-6'}`}>
          {steps.map((step, idx) => (
            <Reveal key={step.num} delay={idx * 100} immediate={compact} transformOnly={true}>
              <div className={`h-full rounded-2xl tile ${compact ? 'p-4 sm:p-5' : 'p-7'} flex flex-col justify-between hover:border-white/30 transition-all duration-200`}>
                <div>
                  <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-6'}`}>
                    <span className="font-mono text-2xl font-bold text-primary/90 tabular-nums">
                      {step.num}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl tile border-white/10 text-white">
                      <i className={`${step.icon} text-base`} />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[rgba(255,255,255,0.55)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 border-t border-white/[0.08] pt-2.5 text-[10px] font-mono text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
                  Step {idx + 1} of 3
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

