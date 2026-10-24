import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from '../../config/axios';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import FileEditor from './FileEditor';
import { useToast } from '../../context/useToast';
import getErrorMessage from '../../utils/getErrorMessage';

export const FilesPanel = ({ projectId }) => {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileError, setNewFileError] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Rename state
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingFile, setDeletingFile] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fadingOutFileId, setFadingOutFileId] = useState(null);

  // Per-file draft contents and save statuses
  const [drafts, setDrafts] = useState({});
  const [saveStatuses, setSaveStatuses] = useState({}); // fileId -> 'saved' | 'saving' | 'unsaved' | 'error'

  const autosaveTimersRef = useRef({});
  const itemRefs = useRef(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const toast = useToast();

  useEffect(() => {
    let frameId;
    frameId = requestAnimationFrame(() => {
      if (!activeFileId) {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const el = itemRefs.current.get(activeFileId);
      if (el) {
        setIndicatorStyle({
          top: el.offsetTop,
          height: el.offsetHeight,
          opacity: 1,
        });
      }
    });
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [activeFileId, files]);


  useEffect(() => {
    if (!projectId) return;

    let ignore = false;
    axios
      .get(`/projects/${projectId}/files`)
      .then((res) => {
        if (ignore) return;
        const list = res.data?.files || [];
        setFiles(list);

        setDrafts((prev) => {
          const next = { ...prev };
          list.forEach((f) => {
            if (next[f._id] === undefined) {
              next[f._id] = f.content || '';
            }
          });
          return next;
        });

        setActiveFileId((currentId) => {
          if (currentId && list.some((f) => f._id === currentId)) {
            return currentId;
          }
          return list[0]?._id || null;
        });
      })
      .catch((err) => {
        if (ignore) return;
        console.error('Fetch files error:', err);
        toast.error(getErrorMessage(err, 'Failed to load project files'));
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectId, toast]);

  const activeFile = useMemo(() => {
    return files.find((f) => f._id === activeFileId) || null;
  }, [files, activeFileId]);

  // Save file content to backend
  const handleSaveFile = useCallback(
    async (fileId, content) => {
      if (!projectId || !fileId) return;

      if (autosaveTimersRef.current[fileId]) {
        clearTimeout(autosaveTimersRef.current[fileId]);
        delete autosaveTimersRef.current[fileId];
      }

      setSaveStatuses((prev) => ({ ...prev, [fileId]: 'saving' }));

      try {
        const res = await axios.put(`/projects/${projectId}/files/${fileId}`, {
          content,
        });

        const updatedFile = res.data?.file;
        setFiles((prev) =>
          prev.map((f) => (f._id === fileId ? { ...f, ...updatedFile, content } : f))
        );
        setSaveStatuses((prev) => ({ ...prev, [fileId]: 'saved' }));
      } catch (err) {
        console.error('Save file error:', err);
        setSaveStatuses((prev) => ({ ...prev, [fileId]: 'error' }));

        const status = err.response?.status;
        if (status === 413) {
          toast.error('File size exceeds the 200 KB limit. Please reduce content size.');
        } else if (status === 409) {
          toast.error('A conflict occurred while saving this file.');
        } else {
          toast.error(getErrorMessage(err, 'Failed to save changes.'));
        }
      }
    },
    [projectId, toast]
  );

  // Content change handler with 1200ms debounced autosave
  const handleChangeContent = useCallback(
    (fileId, newContent) => {
      setDrafts((prev) => ({ ...prev, [fileId]: newContent }));
      setSaveStatuses((prev) => ({ ...prev, [fileId]: 'unsaved' }));

      if (autosaveTimersRef.current[fileId]) {
        clearTimeout(autosaveTimersRef.current[fileId]);
      }

      autosaveTimersRef.current[fileId] = setTimeout(() => {
        handleSaveFile(fileId, newContent);
      }, 1200);
    },
    [handleSaveFile]
  );

  // New File validation
  const validateFileNameAndPath = (name, path) => {
    const cleanName = name.trim();
    const cleanPath = (path || cleanName).trim();

    if (!cleanName) return 'File name is required';
    if (cleanName.length > 100) return 'File name cannot exceed 100 characters';
    if (cleanPath.length > 200) return 'Path cannot exceed 200 characters';
    if (cleanPath.includes('..')) return "Path cannot contain '..'";
    if (cleanPath.startsWith('/')) return 'Path cannot start with a leading slash';
    if (cleanPath.includes('\\')) return 'Path cannot contain backslashes';
    return null;
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    const validationError = validateFileNameAndPath(newFileName, newFilePath);
    if (validationError) {
      setNewFileError(validationError);
      return;
    }

    try {
      setIsCreatingFile(true);
      setNewFileError('');

      const cleanName = newFileName.trim();
      const cleanPath = (newFilePath || cleanName).trim();

      const res = await axios.post(`/projects/${projectId}/files`, {
        name: cleanName,
        path: cleanPath,
        content: '',
      });

      const newFile = res.data?.file;
      setFiles((prev) => [...prev, { ...newFile, isNew: true }]);
      setDrafts((prev) => ({ ...prev, [newFile._id]: '' }));
      setSaveStatuses((prev) => ({ ...prev, [newFile._id]: 'saved' }));
      setActiveFileId(newFile._id);

      toast.success(`File "${cleanName}" created`);
      setNewFileName('');
      setNewFilePath('');
      setIsNewFileModalOpen(false);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setNewFileError('A file with this path already exists');
      } else if (status === 413) {
        setNewFileError('Content is too large (max 200 KB)');
      } else {
        setNewFileError(getErrorMessage(err, 'Failed to create file'));
      }
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleStartRename = (file, e) => {
    e.stopPropagation();
    setRenamingFileId(file._id);
    setRenamingFileName(file.name);
  };

  const handleConfirmRename = async (fileId) => {
    const trimmed = renamingFileName.trim();
    if (!trimmed || isRenaming) return;

    if (trimmed.length > 100) {
      toast.error('File name cannot exceed 100 characters');
      return;
    }

    try {
      setIsRenaming(true);
      const res = await axios.put(`/projects/${projectId}/files/${fileId}`, {
        name: trimmed,
      });

      const updated = res.data?.file;
      setFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, ...updated } : f)));
      toast.success('File renamed successfully');
      setRenamingFileId(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error('A file with this name already exists in this folder');
      } else {
        toast.error(getErrorMessage(err, 'Failed to rename file'));
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!deletingFile) return;
    const fileToDelete = deletingFile;
    setDeletingFile(null);

    try {
      setIsDeleting(true);
      setFadingOutFileId(fileToDelete._id);
      await new Promise((r) => setTimeout(r, 200));
      await axios.delete(`/projects/${projectId}/files/${fileToDelete._id}`);
      toast.success(`Deleted file "${fileToDelete.name}"`);

      setFiles((prev) => {
        const remaining = prev.filter((f) => f._id !== fileToDelete._id);
        if (activeFileId === fileToDelete._id) {
          setActiveFileId(remaining[0]?._id || null);
        }
        return remaining;
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete file'));
    } finally {
      setIsDeleting(false);
      setFadingOutFileId(null);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0f0a07]/95">
      {/* Sidebar: File Explorer */}
      <aside className="w-56 sm:w-64 shrink-0 border-r border-white/[0.08] bg-[#0f0a07]/85 backdrop-blur-md flex flex-col">
        {/* Files Header & Add Button */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#a89384] font-semibold flex items-center gap-1.5">
            <i className="ri-folder-open-line text-xs text-accent" />
            Files ({files.length})
          </span>
          <button
            type="button"
            onClick={() => {
              setNewFileError('');
              setNewFileName('');
              setNewFilePath('');
              setIsNewFileModalOpen(true);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg glass border-glass-border/40 text-[#a89384] hover:text-[#f3e6da] hover:border-accent/40 transition-colors focus-ring"
            title="Create new file"
            aria-label="Create new file"
          >
            <i className="ri-file-add-line text-xs" />
          </button>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {loading ? (
            <div className="space-y-1.5 p-2.5">
              <div className="h-7 w-full rounded-lg bg-white/[0.04] skeleton-shimmer" />
              <div className="h-7 w-full rounded-lg bg-white/[0.04] skeleton-shimmer" />
              <div className="h-7 w-full rounded-lg bg-white/[0.04] skeleton-shimmer" />
            </div>
          ) : files.length > 0 ? (
            <ul className="relative space-y-0.5 px-2" role="list">
              {/* Active Bar indicator transitioning via translateY */}
              {files.length > 0 && indicatorStyle.opacity > 0 && (
                <span
                  className="pointer-events-none absolute left-0 w-1 rounded-r-full bg-gradient-to-b from-accent to-accent-press shadow-[0_0_8px_rgb(var(--accent-rgb)/0.6)] transition-[transform,height,opacity] duration-200 ease-out z-10"
                  style={{
                    transform: `translate3d(0, ${indicatorStyle.top + 6}px, 0)`,
                    height: `${Math.max(0, indicatorStyle.height - 12)}px`,
                    opacity: indicatorStyle.opacity,
                  }}
                  aria-hidden="true"
                />
              )}
              {files.map((file) => {
                const isActive = file._id === activeFileId;
                const isItemRenaming = file._id === renamingFileId;
                const status = saveStatuses[file._id];
                const isFadingOut = file._id === fadingOutFileId;

                return (
                  <li
                    key={file._id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(file._id, el);
                      else itemRefs.current.delete(file._id);
                    }}
                    onClick={() => setActiveFileId(file._id)}
                    className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-mono transition-[background-color,border-color,color] duration-150 cursor-pointer ${
                      isFadingOut
                        ? 'opacity-0 -translate-x-3 transition-[opacity,transform] duration-200 pointer-events-none'
                        : file.isNew
                        ? 'animate-file-row-in'
                        : ''
                    } ${
                      isActive
                        ? 'glass-strong text-[#f3e6da] font-medium border border-accent/30 shadow-[0_0_12px_rgb(var(--accent-rgb)/0.12)]'
                        : 'text-[#a89384] hover:bg-white/[0.04] hover:text-[#f3e6da]'
                    }`}
                  >

                    <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                      <i
                        className={`text-sm ${
                          file.name.endsWith('.json')
                            ? 'ri-braces-line text-[#c4b5a8]/80'
                            : file.name.endsWith('.md')
                            ? 'ri-markdown-line text-accent/80'
                            : 'ri-file-code-line text-accent/80'
                        }`}
                      />

                      {isItemRenaming ? (
                        <input
                          type="text"
                          value={renamingFileName}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenamingFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRename(file._id);
                            if (e.key === 'Escape') setRenamingFileId(null);
                          }}
                          onBlur={() => handleConfirmRename(file._id)}
                          className="w-full glass-input border-accent/50 px-1.5 py-0.5 text-xs text-[#f3e6da] rounded-md outline-none"
                        />
                      ) : (
                        <span className="truncate">{file.path || file.name}</span>
                      )}
                    </div>

                    {/* Status dot / Action icons on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isItemRenaming && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(file, e)}
                            className="p-1 text-[#6e5d50] hover:text-[#f3e6da] rounded focus-ring"
                            title="Rename file"
                            aria-label={`Rename ${file.name}`}
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingFile(file);
                            }}
                            className="p-1 text-[#6e5d50] hover:text-accent rounded focus-ring"
                            title="Delete file"
                            aria-label={`Delete ${file.name}`}
                          >
                            <i className="ri-delete-bin-line text-xs" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Unsaved indicator dot when not hovering */}
                    {status === 'unsaved' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent/70 group-hover:hidden" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs text-[#6e5d50]">
              <p className="mb-2">No files yet</p>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setNewFileError('');
                  setNewFileName('');
                  setNewFilePath('');
                  setIsNewFileModalOpen(true);
                }}
              >
                Create file
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Area: File Editor */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <FileEditor
          activeFile={activeFile}
          draftContent={activeFile ? drafts[activeFile._id] ?? activeFile.content : ''}
          onChangeContent={handleChangeContent}
          onSaveContent={handleSaveFile}
          saveStatus={activeFile ? saveStatuses[activeFile._id] || 'saved' : 'saved'}
          onRetrySave={() => activeFile && handleSaveFile(activeFile._id, drafts[activeFile._id])}
          projectId={projectId}
        />
      </main>

      {/* New File Modal */}
      <Modal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        title="Create New File"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateFile} className="space-y-4">
          {newFileError && (
            <div className="rounded-xl border border-accent-deep bg-accent-tint/40 p-2.5 text-xs text-accent">
              {newFileError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a89384] mb-1.5" htmlFor="new-file-name">
              File Name
            </label>
            <input
              id="new-file-name"
              type="text"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setNewFileError('');
              }}
              placeholder="e.g. server.js or utils/helper.js"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-[#f3e6da] placeholder-[#6e5d50] transition-[border-color,background-color] font-mono"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a89384] mb-1.5" htmlFor="new-file-path">
              Path (Optional folder override)
            </label>
            <input
              id="new-file-path"
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="Defaults to file name (no leading slash)"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-[#f3e6da] placeholder-[#6e5d50] transition-[border-color,background-color] font-mono"
            />
            <p className="mt-1 text-[11px] text-[#6e5d50]">
              No &apos;..&apos;, no leading slashes, max 200 characters.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNewFileModalOpen(false)}
              disabled={isCreatingFile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isCreatingFile}
            >
              Create File
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete File Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFile)}
        onClose={() => setDeletingFile(null)}
        onConfirm={handleDeleteFile}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${deletingFile?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default FilesPanel;
