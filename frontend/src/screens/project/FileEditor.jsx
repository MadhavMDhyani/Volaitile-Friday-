import { useEffect, useRef, useMemo, useState } from 'react';
import Button from '../../components/Button';
import { useToast } from '../../context/useToast';

export const FileEditor = ({
  activeFile,
  draftContent = '',
  onChangeContent,
  onSaveContent,
  saveStatus = 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  onRetrySave,
}) => {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);

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
    }
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
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[#737373] bg-[#0a0a0a]">
        <i className="ri-code-box-line text-4xl mb-2 text-[#404040]" />
        <p className="text-sm font-medium text-[#a3a3a3]">No file selected</p>
        <p className="text-xs text-[#737373] mt-1 max-w-xs">
          Select a file from the explorer on the left or create a new one to begin editing.
        </p>
      </div>
    );
  }

  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[#a3a3a3] animate-fade-in">
            <svg
              className="animate-spin h-3 w-3 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Saving…</span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="flex items-center gap-1 text-[#737373] animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a3a3a3]" />
            <span>Unsaved changes</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-red-400 animate-fade-in">
            <i className="ri-error-warning-line text-xs" />
            <span>Save failed</span>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="underline hover:text-red-300 ml-1 cursor-pointer focus-ring"
              >
                Retry
              </button>
            )}
          </span>
        );
      case 'saved':
      default:
        return (
          <span className="flex items-center gap-1 text-[#737373] animate-fade-in">
            <i className="ri-check-line text-xs text-emerald-400" />
            <span>Saved</span>
          </span>
        );
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0a] text-[#fafafa] overflow-hidden select-none">
      {/* Editor Top Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#262626] bg-[#111111] px-3 text-xs">
        {/* File Path & Language */}
        <div className="flex items-center gap-2 min-w-0">
          <i className="ri-file-text-line text-[#a3a3a3] text-sm" />
          <span className="font-mono text-xs text-[#fafafa] truncate font-medium">
            {activeFile.path || activeFile.name}
          </span>
          <span className="rounded border border-[#262626] bg-[#171717] px-1.5 py-0.5 text-[10px] font-mono text-[#737373] uppercase">
            {activeFile.language || 'text'}
          </span>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono">{renderStatus()}</div>

          <div className="h-3 w-[1px] bg-[#262626]" />

          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopyContent}
            icon={
              copied ? (
                <i className="ri-check-line text-emerald-400 text-xs" />
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

      {/* Editor Body: Gutter + Monospace Textarea */}
      <div className="relative flex flex-1 overflow-hidden font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 shrink-0 overflow-hidden select-none border-r border-[#262626] bg-[#0d0d0d] py-3 text-right text-[#525252] font-mono"
          aria-hidden="true"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-5 leading-5 pr-2.5">
              {num}
            </div>
          ))}
        </div>

        {/* Synchronized Textarea */}
        <div className="relative flex-1 overflow-hidden">
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
            autoCorrect="off"
            className="h-full w-full resize-none border-0 bg-transparent py-3 px-3 font-mono text-xs leading-5 text-[#fafafa] placeholder-[#525252] outline-none focus:ring-0 focus:outline-none"
            aria-label={`Code editor for ${activeFile.name}`}
          />
        </div>
      </div>
    </div>
  );
};

export default FileEditor;
