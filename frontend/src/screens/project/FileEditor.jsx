import { useEffect, useRef, useMemo, useState } from 'react';
import Button from '../../components/Button';
import { useToast } from '../../context/useToast';
import AiCodeAssistant from './AiCodeAssistant';

export const FileEditor = ({
  activeFile,
  draftContent = '',
  onChangeContent,
  onSaveContent,
  saveStatus = 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  onRetrySave,
  projectId,
}) => {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return (draftContent || '').split('\n').length;
  }, [draftContent]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);
  }, [lineCount]);

  // Synchronize gutter scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle Tab key (insert 2 spaces) and Ctrl/Cmd+S
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChangeContent(activeFile._id, newValue);

      // Restore cursor position after the 2 spaces
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeFile?._id) {
        onSaveContent(activeFile._id, draftContent);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      setIsAiAssistantOpen((prev) => !prev);
    }
  };

  const handleInsertCode = (code) => {
    if (!activeFile?._id) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = draftContent || '';
      const updated = value.substring(0, start) + code + value.substring(end);
      onChangeContent(activeFile._id, updated);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + code.length;
          textareaRef.current.focus();
        }
      });
    } else {
      const updated = (draftContent ? draftContent + '\n\n' : '') + code;
      onChangeContent(activeFile._id, updated);
    }
  };

  const handleReplaceCode = (code) => {
    if (!activeFile?._id) return;
    onChangeContent(activeFile._id, code);
  };

  // Warn user before leaving page if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(draftContent || '');
      setCopied(true);
      toast.info('File content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy content to clipboard');
    }
  };

  if (!activeFile) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[rgba(255,255,255,0.35)] bg-[#070707]/95">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl tile border-border/50 text-primary/60 mb-3 shadow-tile">
          <i className="ri-code-box-line text-3xl" />
        </div>
        <p className="text-sm font-medium text-white">No file selected</p>
        <p className="text-xs text-[rgba(255,255,255,0.55)] mt-1 max-w-xs leading-relaxed">
          Select a file from the explorer on the left or create a new one to begin editing.
        </p>
      </div>
    );
  }

  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.55)] font-mono text-[11px] animate-fade-in">
            <svg
              className="animate-spin h-3 w-3 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Saving...</span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.55)] font-mono text-[11px] animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Unsaved changes</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-primary font-mono text-[11px] animate-fade-in">
            <i className="ri-error-warning-line text-xs" />
            <span>Save failed</span>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="underline hover:text-primary-hover ml-1 cursor-pointer focus-ring"
              >
                Retry
              </button>
            )}
          </span>
        );
      case 'saved':
      default:
        return (
          <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.70)] font-mono text-[11px] animate-fade-in">
            <i className="ri-check-line text-xs" />
            <span>Saved</span>
          </span>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#070707]/95 text-white overflow-hidden select-none">
      {/* Editor Top Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] bg-tile-deep px-3.5 text-xs">
        {/* File Path & Language */}
        <div className="flex items-center gap-2 min-w-0">
          <i className="ri-file-text-line text-primary text-sm" />
          <span className="font-mono text-xs text-white truncate font-medium">
            {activeFile.path || activeFile.name}
          </span>
          <span className="rounded-md border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-[rgba(255,255,255,0.70)] uppercase">
            {activeFile.language || 'text'}
          </span>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono">{renderStatus()}</div>

          <div className="h-3 w-[1px] bg-white/[0.1]" />

          <Button
            variant={isAiAssistantOpen ? 'primary' : 'ghost'}
            size="xs"
            onClick={() => setIsAiAssistantOpen((prev) => !prev)}
            icon={<i className="ri-sparkling-fill text-primary text-xs" />}
            title="Toggle Friday AI Assistant (Ctrl+I)"
            aria-label="Toggle Friday AI Assistant"
            className={isAiAssistantOpen ? 'shadow-[0_0_12px_rgb(var(--accent-rgb)/0.4)]' : ''}
          >
            <span className="hidden sm:inline">Friday AI</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopyContent}
            icon={
              copied ? (
                <i className="ri-check-line text-[rgba(255,255,255,0.70)] text-xs" />
              ) : (
                <i className="ri-file-copy-line text-xs" />
              )
            }
            title="Copy file content"
            aria-label="Copy file content"
          >
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>

          <Button
            variant="secondary"
            size="xs"
            onClick={() => onSaveContent(activeFile._id, draftContent)}
            disabled={saveStatus === 'saved' || saveStatus === 'saving'}
            icon={<i className="ri-save-line text-xs" />}
            title="Save file (Ctrl+S / Cmd+S)"
            aria-label="Save file"
          >
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Editor Body: Gutter + Monospace Textarea + AI Assistant Panel */}
      <div className="relative flex flex-1 overflow-hidden font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 shrink-0 overflow-hidden select-none border-r border-white/[0.08] bg-[#070707]/95 py-3 text-right text-white/30 font-mono text-xs select-none"
          aria-hidden="true"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-5 leading-5 pr-2.5">
              {num}
            </div>
          ))}
        </div>

        {/* Synchronized Textarea */}
        <div className="relative flex-1 overflow-hidden bg-[#070707]/95">
          <textarea
            ref={textareaRef}
            value={draftContent}
            onChange={(e) => onChangeContent(activeFile._id, e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder="Type code here..."
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            wrap="off"
            className="h-full w-full resize-none border-0 bg-transparent py-3 px-3 font-mono text-xs leading-5 text-white placeholder-white/20 outline-none focus:ring-0 focus:outline-none overflow-x-auto whitespace-pre"
            aria-label={`Code editor for ${activeFile.name}`}
          />
        </div>

        {/* AI Assistant Split Panel */}
        {isAiAssistantOpen && (
          <div className="w-full sm:w-[380px] md:w-[420px] shrink-0 h-full border-l border-white/[0.1] z-20">
            <AiCodeAssistant
              isOpen={isAiAssistantOpen}
              onClose={() => setIsAiAssistantOpen(false)}
              activeFile={activeFile}
              draftContent={draftContent}
              projectId={projectId}
              onInsertCode={handleInsertCode}
              onReplaceCode={handleReplaceCode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileEditor;


