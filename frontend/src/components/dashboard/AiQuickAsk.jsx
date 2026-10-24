import { useState } from 'react';
import axios from '../../config/axios';
import Button from '../Button';
import getErrorMessage from '../../utils/getErrorMessage';

export const AiQuickAsk = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { question, reply, source, error, isRateLimited }

  const handleAsk = async (e) => {
    e.preventDefault();
    const prompt = question.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await axios.post('/ai/chat', { message: prompt });
      setResult({
        question: prompt,
        reply: res.data?.reply || 'Assistant response received.',
        source: res.data?.source, // 'gemini' | 'offline'
        model: res.data?.model,
        latencyMs: res.data?.latencyMs,
        isRateLimited: false,
      });
      setQuestion('');
    } catch (err) {
      console.error('AI quick ask error:', err);
      const is429 = err.response?.status === 429;
      setResult({
        question: prompt,
        reply: is429
          ? 'AI rate limit reached. Please wait a moment before asking again.'
          : getErrorMessage(err, 'Unable to get AI response.'),
        source: null,
        isRateLimited: is429,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReply = () => {
    if (result?.reply) {
      navigator.clipboard.writeText(result.reply);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl glass p-4 text-xs font-sans border-glass-border/60 shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-hover text-[#140d09] font-mono font-bold text-[10px] shadow-[0_0_12px_rgb(var(--accent-rgb)/0.35)]">
            AI
          </span>
          <h3 className="font-semibold text-sm text-[#f3e6da] tracking-tight">
            Friday AI Quick Ask
          </h3>
        </div>
        <span className="text-[10px] font-mono text-accent/70 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Powered by Gemini
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="relative flex items-center">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a technical question, debug snippet, or explain a concept..."
          className="w-full rounded-xl glass-input pl-3.5 pr-20 py-2.5 text-xs text-[#f3e6da] placeholder-[#6e5d50] transition-[border-color,background-color]"
          maxLength={1000}
          disabled={isLoading}
          aria-label="Ask Friday AI"
        />

        <div className="absolute right-1.5">
          <Button
            type="submit"
            variant="primary"
            size="xs"
            disabled={!question.trim() || isLoading}
            loading={isLoading}
            icon={<i className="ri-send-plane-fill text-xs" />}
            aria-label="Send question to Friday AI"
          >
            Ask
          </Button>
        </div>
      </form>

      {/* Reply Container */}
      {isLoading && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent-tint/25 p-3 text-xs text-[#c4b5a8]/90 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="font-mono text-[11px] text-accent/80 ml-1">
            Friday AI is thinking...
          </span>
        </div>
      )}

      {result && !isLoading && (
        <div
          className={`mt-3 rounded-xl border p-3.5 animate-fade-in text-xs shadow-glass ${
            result.isError
              ? result.isRateLimited
                ? 'border-accent-hover/30 bg-accent-tint/30 text-[#c4b5a8]'
                : 'border-accent-deep bg-accent-tint/40 text-accent'
              : 'border-white/[0.1] bg-white/[0.03] text-[#f3e6da]'
          }`}
        >
          {/* Header of reply */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5 font-mono text-[10px]">
            <span className="truncate max-w-[200px] text-[#a89384] italic">
              &quot;{result.question}&quot;
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {result.source && (
                <span
                  className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[#c4b5a8] uppercase cursor-default font-mono text-[9px]"
                  title={result.latencyMs ? `Latency: ${result.latencyMs}ms` : undefined}
                >
                  {result.source === 'gemini' ? (result.model || 'Gemini AI') : 'Offline Engine'}
                </span>
              )}
              {!result.isError && (
                <button
                  type="button"
                  onClick={handleCopyReply}
                  className="text-[#a89384] hover:text-[#f3e6da] transition-colors focus-ring rounded p-1"
                  title="Copy AI response"
                  aria-label="Copy AI response"
                >
                  <i className="ri-file-copy-line text-xs" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-[#a89384] hover:text-[#f3e6da] transition-colors focus-ring rounded p-1"
                title="Dismiss response"
                aria-label="Dismiss AI response"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </div>
          </div>

          {/* Reply Text */}
          <p className="whitespace-pre-wrap leading-relaxed text-[#c4b5a8]">
            {result.reply}
          </p>
        </div>
      )}
    </div>
  );
};

export default AiQuickAsk;
