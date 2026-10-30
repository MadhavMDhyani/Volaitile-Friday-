import { Link } from 'react-router-dom';
import Reveal from './Reveal';

export const FinalCTA = ({ compact = false }) => {
  return (
    <section className={`${compact ? 'py-12 sm:py-16' : 'py-20 sm:py-28'} relative`}>
      <div className={`mx-auto ${compact ? 'max-w-4xl' : 'max-w-5xl'} px-4 sm:px-6 lg:px-8`}>
        <Reveal delay={0} transformOnly={true}>
          <div className={`relative rounded-3xl tile border border-primary/30 ${compact ? 'p-6 sm:p-10' : 'p-8 sm:p-14'} text-center overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9),0_0_40px_rgba(51,188,101,0.08)]`}>
            {/* Luminous yellow radial flare in background */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none opacity-20 blur-[80px]"
              style={{
                background: 'radial-gradient(circle, rgba(51,188,101,0.6) 0%, rgba(18,220,239,0.2) 40%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono text-primary font-semibold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              START IN SECONDS
            </span>

            <h2 className={`${compact ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'} font-medium tracking-tight text-white leading-tight max-w-2xl mx-auto`}>
              Ready to build faster with your team?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[rgba(255,255,255,0.55)] max-w-xl mx-auto leading-relaxed">
              Create a project workspace, invite your collaborators, and start coding with Friday AI today.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full text-sm font-semibold bg-primary text-[#070707] hover:bg-[#2da858] transition-all shadow-[0_0_24px_rgba(51,188,101,0.4)] hover:shadow-[0_0_40px_rgba(51,188,101,0.6)] focus-ring"
              >
                Create your account
                <i className="ri-arrow-right-line ml-1.5 text-base" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center rounded-xl text-sm font-medium text-[#F5F3FF] tile hover:border-white/30 transition-all focus-ring"
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

