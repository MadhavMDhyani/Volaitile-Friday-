import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import Button from '../../components/Button';
import { useToast } from '../../context/useToast';
import getErrorMessage from '../../utils/getErrorMessage';

export const AiCodeAssistant = ({
  isOpen,
  onClose,
  activeFile,
  draftContent = '',
  projectId,
  onInsertCode,
  onReplaceCode,
}) => {
  const toast = useToast();
  const [mode, setMode] = useState('generate'); // 'generate' | 'review' | 'explain'
  const [selectedModel, setSelectedModel] = useState('auto');
  const [availableModels, setAvailableModels] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Infer default language and framework from filename
  const fileName = (activeFile?.name || '').toLowerCase();
  let defaultLanguage = 'javascript';
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) defaultLanguage = 'typescript';
  else if (fileName.endsWith('.py')) defaultLanguage = 'python';
  else if (fileName.endsWith('.html')) defaultLanguage = 'html';
  else if (fileName.endsWith('.css')) defaultLanguage = 'css';
  else if (fileName.endsWith('.json')) defaultLanguage = 'json';
  else if (fileName.endsWith('.sql')) defaultLanguage = 'sql';
  else if (fileName.endsWith('.sh')) defaultLanguage = 'bash';

  const defaultFramework =
    fileName.includes('react') || fileName.endsWith('.jsx') || fileName.endsWith('.tsx')
      ? 'react'
      : 'express';

  // Generate Mode State
  const [prompt, setPrompt] = useState('');
  const [userLanguage, setUserLanguage] = useState(null);
  const [userFramework, setUserFramework] = useState(null);
  const language = userLanguage ?? defaultLanguage;
  const framework = userFramework ?? defaultFramework;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [generateError, setGenerateError] = useState('');

  // Review Mode State
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewError, setReviewError] = useState('');

  // Explain Mode State
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainResult, setExplainResult] = useState(null);
  const [explainError, setExplainError] = useState('');

  // Fetch available models from backend registry
  useEffect(() => {
    if (!isOpen) return;
    axios
      .get('/ai/models')
      .then((res) => {
        if (Array.isArray(res.data?.models)) {
          setAvailableModels(res.data.models);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch AI models:', err.message);
      });
  }, [isOpen]);

  // Handle Generate Code
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate code');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');
    try {
      const res = await axios.post('/ai/generate-code', {
        prompt: prompt.trim(),
        language,
        framework,
        model: selectedModel,
      });

      setGeneratedResult({
        code: res.data.code,
        source: res.data.source || 'gemini',
        model: res.data.model || selectedModel,
        latencyMs: res.data.latencyMs || 0,
      });
      toast.success('Code generated successfully');
    } catch (err) {
      console.error('AI code generation error:', err);
      const msg = getErrorMessage(err, 'Failed to generate code');
      setGenerateError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Review Code
  const handleReview = async () => {
    const codeToReview = draftContent.trim();
    if (!codeToReview) {
      toast.error('Current file is empty. Nothing to review.');
      return;
    }

    setIsReviewing(true);
    setReviewError('');
    try {
      const res = await axios.post('/ai/review', {
        code: codeToReview,
        language,
        framework,
        model: selectedModel,
      });

      setReviewResult({
        review: res.data.review,
        source: res.data.source || 'gemini',
        model: res.data.model || selectedModel,
        latencyMs: res.data.latencyMs || 0,
      });
      toast.success('Code analysis complete');
    } catch (err) {
      console.error('AI code review error:', err);
      const msg = getErrorMessage(err, 'Failed to review code');
      setReviewError(msg);
      toast.error(msg);
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle Explain Code
  const handleExplain = async () => {
    const codeToExplain = draftContent.trim();
    if (!codeToExplain) {
      toast.error('Current file is empty. Nothing to explain.');
      return;
    }

    setIsExplaining(true);
    setExplainError('');
    try {
      const message = `Please explain this ${language} file (${activeFile?.name || 'file'}):\n\n\`\`\`${language}\n${codeToExplain.slice(0, 3500)}\n\`\`\`\nProvide an overview, key functions, security considerations, and architecture best practices.`;
      
      const payload = {
        message,
        model: selectedModel,
      };
      if (projectId) payload.projectId = projectId;

      const res = await axios.post('/ai/chat', payload);

      setExplainResult({
        reply: res.data.reply,
        source: res.data.source || 'gemini',
        model: res.data.model || selectedModel,
        latencyMs: res.data.latencyMs || 0,
      });
      toast.success('Explanation ready');
    } catch (err) {
      console.error('AI code explain error:', err);
      const msg = getErrorMessage(err, 'Failed to explain code');
      setExplainError(msg);
      toast.error(msg);
    } finally {
      setIsExplaining(false);
    }
  };

  const copyToClipboard = async (text, index = 0) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.info('Copied to clipboard');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-white/[0.12] bg-tile-deep text-white shadow-2xl animate-fade-in overflow-hidden z-20"
      aria-label="Friday AI Code Assistant"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] px-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgb(var(--accent-rgb)/0.3)]">
            <i className="ri-sparkling-fill text-xs" />
          </div>
          <div>
            <span className="font-mono text-xs font-semibold text-white flex items-center gap-1.5">
              Friday AI
              <span className="text-[10px] font-sans font-normal text-[rgba(255,255,255,0.70)] rounded px-1.5 py-0.2 bg-raised/40 border border-white/10">
                v2.0
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-white outline-none hover:border-white/25 focus:border-accent transition-all"
            aria-label="Select AI Model"
          >
            <option value="auto" className="bg-[#070707] text-white">
              ⚡ Auto (Optimized)
            </option>
            {availableModels.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#070707] text-white">
                {m.label} ({m.speed})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.08] transition-colors focus-ring"
            title="Close AI Assistant"
            aria-label="Close AI Assistant"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex shrink-0 border-b border-white/[0.08] bg-white/[0.01] p-1 gap-1">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
            mode === 'generate'
              ? 'bg-white/[0.1] text-primary border border-white/[0.12] shadow-sm'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <i className="ri-flashlight-line text-xs" />
          <span>Generate</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('review')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
            mode === 'review'
              ? 'bg-white/[0.1] text-primary border border-white/[0.12] shadow-sm'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <i className="ri-shield-check-line text-xs" />
          <span>Security Review</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('explain')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
            mode === 'explain'
              ? 'bg-white/[0.1] text-[rgba(255,255,255,0.70)] border border-white/[0.12] shadow-sm'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <i className="ri-question-line text-xs" />
          <span>Explain</span>
        </button>
      </div>

      {/* Mode Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= MODE: GENERATE ================= */}
        {mode === 'generate' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,0.55)]">
              <span className="font-medium text-white flex items-center gap-1.5">
                <i className="ri-magic-line text-primary" />
                Prompt
              </span>
              <span className="text-[11px] font-mono text-[rgba(255,255,255,0.35)]">
                Ctrl+Enter to generate
              </span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="e.g. Create an Express router with JWT middleware, error handling, and MongoDB CRUD queries..."
              rows={4}
              className="w-full rounded-xl border border-white/[0.12] bg-[#070707]/95 p-3 font-sans text-xs text-white placeholder-white/25 outline-none focus:border-accent transition-all resize-none"
            />

            {/* Language & Framework Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[rgba(255,255,255,0.55)] mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setUserLanguage(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] p-1.5 font-mono text-xs text-white outline-none hover:border-white/20 focus:border-accent"
                >
                  <option value="javascript" className="bg-[#070707]">JavaScript</option>
                  <option value="typescript" className="bg-[#070707]">TypeScript</option>
                  <option value="python" className="bg-[#070707]">Python</option>
                  <option value="html" className="bg-[#070707]">HTML</option>
                  <option value="css" className="bg-[#070707]">CSS / Tailwind</option>
                  <option value="sql" className="bg-[#070707]">SQL</option>
                  <option value="json" className="bg-[#070707]">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[rgba(255,255,255,0.55)] mb-1">
                  Framework
                </label>
                <select
                  value={framework}
                  onChange={(e) => setUserFramework(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] p-1.5 font-mono text-xs text-white outline-none hover:border-white/20 focus:border-accent"
                >
                  <option value="express" className="bg-[#070707]">Express</option>
                  <option value="react" className="bg-[#070707]">React</option>
                  <option value="node" className="bg-[#070707]">Node.js Native</option>
                  <option value="none" className="bg-[#070707]">Vanilla / None</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center mt-2 shadow-[0_0_18px_rgb(var(--accent-rgb)/0.25)]"
              onClick={handleGenerate}
              loading={isGenerating}
              icon={<i className="ri-sparkling-line text-sm" />}
            >
              Generate Code
            </Button>

            {generateError && (
              <div className="rounded-xl border border-accent/25 bg-primary-tint/40 p-3 text-xs text-primary">
                <i className="ri-error-warning-line mr-1.5 text-primary" />
                {generateError}
              </div>
            )}

            {/* Generated Output Card */}
            {generatedResult && (
              <div className="rounded-xl border border-white/[0.12] bg-[#070707]/95 overflow-hidden shadow-tile animate-fade-up">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[rgba(255,255,255,0.70)]">{generatedResult.model}</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[rgba(255,255,255,0.55)]">{generatedResult.latencyMs}ms</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[10px] uppercase text-primary">
                      {generatedResult.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedResult.code, 1)}
                      className="px-2 py-0.5 rounded text-[11px] text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="Copy Code"
                    >
                      {copiedIndex === 1 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] text-white whitespace-pre-wrap leading-relaxed select-text bg-[#070707]">
                  {generatedResult.code}
                </div>

                {/* Insertion Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-white/[0.02] p-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      onInsertCode(generatedResult.code);
                      toast.success('Inserted code into editor');
                    }}
                    icon={<i className="ri-text text-xs" />}
                  >
                    Insert at Cursor
                  </Button>

                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      onReplaceCode(generatedResult.code);
                      toast.success('Replaced file content with generated code');
                    }}
                    icon={<i className="ri-file-code-line text-xs" />}
                  >
                    Replace File
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODE: SECURITY REVIEW ================= */}
        {mode === 'review' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-3 text-xs leading-relaxed text-[rgba(255,255,255,0.55)]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <i className="ri-shield-keyhole-line text-primary" />
                Active Target: <span className="font-mono text-primary">{activeFile?.name || 'Current file'}</span>
              </div>
              Runs static code audit for OWASP vulnerabilities, injection risks, memory leaks, and async bug patterns.
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={handleReview}
              loading={isReviewing}
              icon={<i className="ri-search-eye-line text-sm" />}
            >
              Analyze Active File
            </Button>

            {reviewError && (
              <div className="rounded-xl border border-accent/25 bg-primary-tint/40 p-3 text-xs text-primary">
                <i className="ri-error-warning-line mr-1.5 text-primary" />
                {reviewError}
              </div>
            )}

            {reviewResult && (
              <div className="rounded-xl border border-white/[0.12] bg-[#070707]/95 overflow-hidden shadow-tile animate-fade-up">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[rgba(255,255,255,0.70)]">{reviewResult.model}</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[rgba(255,255,255,0.55)]">{reviewResult.latencyMs}ms</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[10px] uppercase text-primary">
                      {reviewResult.source}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(reviewResult.review, 2)}
                    className="px-2 py-0.5 rounded text-[11px] text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.08]"
                  >
                    {copiedIndex === 2 ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="p-3.5 max-h-80 overflow-y-auto text-xs text-white leading-relaxed whitespace-pre-wrap select-text bg-[#070707] font-mono">
                  {reviewResult.review}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MODE: EXPLAIN ================= */}
        {mode === 'explain' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-3 text-xs leading-relaxed text-[rgba(255,255,255,0.55)]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <i className="ri-lightbulb-line text-primary" />
                Code Intelligence & Documentation
              </div>
              Generates a clear explanation of what this code does, architecture choices, time complexity, and edge cases.
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={handleExplain}
              loading={isExplaining}
              icon={<i className="ri-question-answer-line text-sm" />}
            >
              Explain File Content
            </Button>

            {explainError && (
              <div className="rounded-xl border border-accent/25 bg-primary-tint/40 p-3 text-xs text-primary">
                <i className="ri-error-warning-line mr-1.5 text-primary" />
                {explainError}
              </div>
            )}

            {explainResult && (
              <div className="rounded-xl border border-white/[0.12] bg-[#070707]/95 overflow-hidden shadow-tile animate-fade-up">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[rgba(255,255,255,0.70)]">{explainResult.model}</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[rgba(255,255,255,0.55)]">{explainResult.latencyMs}ms</span>
                    <span className="text-[rgba(255,255,255,0.35)]">·</span>
                    <span className="text-[10px] uppercase text-primary">
                      {explainResult.source}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(explainResult.reply, 3)}
                    className="px-2 py-0.5 rounded text-[11px] text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-white/[0.08]"
                  >
                    {copiedIndex === 3 ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="p-3.5 max-h-80 overflow-y-auto text-xs text-white leading-relaxed whitespace-pre-wrap select-text bg-[#070707] font-sans">
                  {explainResult.reply}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="shrink-0 border-t border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[10px] font-mono text-[rgba(255,255,255,0.35)] flex items-center justify-between">
        <span>Press <kbd className="rounded border border-white/20 bg-white/10 px-1 text-[9px] text-[rgba(255,255,255,0.55)]">Ctrl+I</kbd> to toggle</span>
        <span className="flex items-center gap-1 text-primary/80">
          <i className="ri-lock-line text-[10px]" /> Private Workspace
        </span>
      </div>
    </aside>
  );
};

export default AiCodeAssistant;


