import { Link } from 'react-router-dom';
import InfoPageLayout from '../components/landing/InfoPageLayout';
import FAQSection from '../components/landing/FAQ';
import Reveal from '../components/landing/Reveal';
import usePageMeta from '../hooks/usePageMeta';

export const Faq = () => {
  usePageMeta({
    title: 'FAQ',
    description:
      'Frequently asked questions about Volaitile Friday workspaces, Friday AI integration, self-hosting with Docker, and security architecture.',
  });

  return (
    <InfoPageLayout>
      <FAQSection asH1={true} isPage={true} />

      {/* Still Have Questions CTA */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <Reveal delay={100} transformOnly={true}>
          <div className="rounded-2xl glass p-8 sm:p-10 text-center border border-white/10 max-w-2xl mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl glass border-accent/30 text-accent mx-auto mb-4 shadow-[0_0_16px_rgb(var(--accent-rgb)/0.2)]">
              <i className="ri-question-answer-line text-2xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f3e6da]">
              Still have questions?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#a89384] leading-relaxed max-w-md mx-auto">
              Get started with an account in seconds to test the real-time editor and room chat, or explore the codebase architecture on the About page.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-accent text-[#140d09] hover:bg-accent-hover transition-all shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] focus-ring"
              >
                Create free workspace
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center rounded-xl text-xs font-medium text-[#f3e6da] glass hover:border-white/30 transition-all focus-ring"
              >
                Learn about Friday
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </InfoPageLayout>
  );
};

export default Faq;
