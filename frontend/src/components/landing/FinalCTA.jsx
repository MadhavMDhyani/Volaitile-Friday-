import { Link } from 'react-router-dom';
import Reveal from './Reveal';

export const FinalCTA = () => {
  return (
    <section className="py-20 sm:py-28 relative landing-section-contain">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal delay={0} transformOnly={true}>
          <div className="relative rounded-3xl glass-strong border border-accent/30 p-8 sm:p-14 text-center overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9),0_0_40px_rgb(var(--accent-rgb)/0.08)]">
            {/* Luminous yellow radial flare in background */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none opacity-20 blur-[80px]"
              style={{
                background: 'radial-gradient(circle, rgb(var(--accent-rgb)) 0%, #c47a4a 40%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-mono text-accent font-semibold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              START IN SECONDS
            </span>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#f3e6da] leading-tight max-w-2xl mx-auto">
              Ready to build faster with your team?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#a89384] max-w-xl mx-auto leading-relaxed">
              Create a project workspace, invite your collaborators, and start coding with Friday AI today.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/register"
                viewTransition
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-[background-color,transform] shadow-[0_0_24px_rgb(var(--accent-rgb)/0.4)] focus-ring"
              >
                Create your account
                <i className="ri-arrow-right-line ml-1.5 text-base" />
              </Link>

              <Link
                to="/login"
                viewTransition
                className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center rounded-xl text-sm font-medium text-[#f3e6da] glass hover:border-white/30 transition-[border-color,color] focus-ring"
              >
                Sign in to workspace
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FinalCTA;
