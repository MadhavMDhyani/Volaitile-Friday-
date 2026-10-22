import { useState } from 'react';
import Reveal from './Reveal';

const FAQ_ITEMS = [
  {
    q: 'What is Volaitile Friday?',
    a: 'Volaitile Friday is an all-in-one real-time developer workspace. It combines an in-browser code editor, multi-file project workspace, live Socket.IO room chat with typing indicators, and Friday AI assistance powered by Google Gemini.',
  },
  {
    q: 'How does Friday AI work in the workspace?',
    a: 'Friday AI is powered by Google Gemini 2.5 models (with options for Fast, Balanced, and Deep modes) and is integrated into your project chat rooms. You can mention @friday or use slash commands like /docker, /auth, /db, or /help. If an external AI connection is unavailable, it automatically falls back to a resilient offline assistance engine.',
  },
  {
    q: 'How is project data and source code secured?',
    a: 'All project routes are protected with strict JWT verification and Mongoose membership checks. Sensitive passwords are cryptographically hashed using bcrypt. When you sign out, your JWT token is actively blacklisted in Redis to prevent session reuse. The Express server enforces Helmet HTTP security headers and endpoint rate limiting.',
  },
  {
    q: 'Can I self-host Volaitile Friday on my own server?',
    a: 'Yes! Volaitile Friday includes a production-ready docker-compose.yml file orchestrating MongoDB 7, Redis 7, a Node 20 Express backend container, and a multi-stage Nginx Alpine frontend container. Database ports are kept on an isolated internal network for maximum security.',
  },
  {
    q: 'What limits exist for files, members, and API calls?',
    a: 'Each workspace supports up to 25 members and 100 files, with a 200 KB per-file safety guard. Authentication and AI endpoints feature built-in rate limiters (20 AI requests/min, 30 chat messages/min) to prevent resource exhaustion and ensure high availability.',
  },
];

export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx((curr) => (curr === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              GOT QUESTIONS?
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa] leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#a3a3a3] leading-relaxed">
              Clear, honest answers about our tech stack, security, and hosting.
            </p>
          </Reveal>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            const contentId = `faq-content-${idx}`;
            const headerId = `faq-header-${idx}`;

            return (
              <Reveal key={item.q} delay={idx * 60} transformOnly={true}>
                <div className="rounded-2xl glass border border-white/10 overflow-hidden transition-all duration-200">
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left text-sm sm:text-base font-semibold text-[#fafafa] hover:text-white transition-colors focus-ring cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg glass text-xs text-[#a3a3a3] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-accent' : ''
                      }`}
                      aria-hidden="true"
                    >
                      <i className="ri-arrow-down-s-line" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={headerId}
                      className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#a3a3a3] leading-relaxed border-t border-white/[0.06] pt-3.5 animate-fade-in"
                    >
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
