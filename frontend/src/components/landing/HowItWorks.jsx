import Reveal from './Reveal';

export const HowItWorks = () => {
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
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-mono uppercase tracking-wider text-brand-yellow font-semibold">
              SIMPLE WORKFLOW
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa] leading-tight">
              From zero to shipping in 3 steps
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#a3a3a3] leading-relaxed">
              No complex pipeline setup or external plugins required. Everything is ready the moment you sign in.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <Reveal key={step.num} delay={idx * 100} transformOnly={true}>
              <div className="h-full rounded-2xl glass p-7 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-bold text-brand-yellow/90 tabular-nums">
                      {step.num}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl glass border-white/10 text-[#fafafa]">
                      <i className={`${step.icon} text-lg`} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#fafafa]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#a3a3a3] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/[0.08] pt-3 text-[10px] font-mono text-[#737373] uppercase tracking-wider">
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
