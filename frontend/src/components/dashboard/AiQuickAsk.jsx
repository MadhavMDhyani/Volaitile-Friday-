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
    <div className="flex flex-col rounded-lg border border-[#262626] bg-[#111111] p-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[#0a0a0a] font-mono font-bold text-[10px]">
            AI
          </span>
          <h3 className="font-semibold text-sm text-[#fafafa] tracking-tight">
            Friday AI Quick Ask
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#737373]">Powered by Gemini</span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="relative flex items-center">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a technical question, debug snippet, or explain a concept..."
          className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] pl-3 pr-16 py-2 text-xs text-[#fafafa] placeholder-[#737373] focus-ring transition-colors"
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
        <div className="mt-3 flex items-center gap-2 rounded-md border border-[#262626] bg-[#0a0a0a] p-3 text-xs text-[#a3a3a3] animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="font-mono text-[11px] text-[#737373] ml-1">
            Friday AI is thinking...
          </span>
        </div>
      )}

      {result && !isLoading && (
        <div
          className={`mt-3 rounded-md border p-3 animate-fade-in text-xs ${
            result.isError
              ? result.isRateLimited
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-[#262626] bg-[#0a0a0a] text-[#fafafa]'
          }`}
        >
          {/* Header of reply */}
          <div className="flex items-center justify-between border-b border-[#262626]/60 pb-2 mb-2 font-mono text-[10px]">
            <span className="truncate max-w-[200px] text-[#737373] italic">
              &quot;{result.question}&quot;
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {result.source && (
                <span className="rounded border border-[#404040] bg-[#171717] px-1.5 py-0.2 text-[#a3a3a3] uppercase">
                  {result.source === 'gemini' ? 'Gemini AI' : 'Offline Engine'}
                </span>
              )}
              {!result.isError && (
                <button
                  type="button"
                  onClick={handleCopyReply}
                  className="text-[#737373] hover:text-[#fafafa] transition-colors focus-ring rounded"
                  title="Copy AI response"
                  aria-label="Copy AI response"
                >
                  <i className="ri-file-copy-line text-xs" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-[#737373] hover:text-[#fafafa] transition-colors focus-ring rounded"
                title="Dismiss response"
                aria-label="Dismiss AI response"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </div>
          </div>

          {/* Reply Text */}
          <p className="whitespace-pre-wrap leading-relaxed text-[#e5e5e5]">
            {result.reply}
          </p>
        </div>
      )}
    </div>
  );
};

export default AiQuickAsk;
