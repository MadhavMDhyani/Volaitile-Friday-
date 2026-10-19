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

  // Per-file draft contents and save statuses
  const [drafts, setDrafts] = useState({});
  const [saveStatuses, setSaveStatuses] = useState({}); // fileId -> 'saved' | 'saving' | 'unsaved' | 'error'

  const autosaveTimersRef = useRef({});
  const toast = useToast();


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
      setFiles((prev) => [...prev, newFile]);
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

    try {
      setIsDeleting(true);
      await axios.delete(`/projects/${projectId}/files/${deletingFile._id}`);
      toast.success(`Deleted file "${deletingFile.name}"`);

      setFiles((prev) => {
        const remaining = prev.filter((f) => f._id !== deletingFile._id);
        if (activeFileId === deletingFile._id) {
          setActiveFileId(remaining[0]?._id || null);
        }
        return remaining;
      });
      setDeletingFile(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete file'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#05060a]/90">
      {/* Sidebar: File Explorer */}
      <aside className="w-56 sm:w-64 shrink-0 border-r border-white/[0.08] bg-[#090b10]/75 backdrop-blur-md flex flex-col">
        {/* Files Header & Add Button */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#a3a3a3] font-semibold flex items-center gap-1.5">
            <i className="ri-folder-open-line text-xs text-cyan-400" />
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
            className="flex h-6 w-6 items-center justify-center rounded-lg glass border-glass-border/40 text-[#a3a3a3] hover:text-[#fafafa] hover:border-cyan-400/40 transition-all focus-ring"
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
            <ul className="space-y-0.5 px-2" role="list">
              {files.map((file) => {
                const isActive = file._id === activeFileId;
                const isItemRenaming = file._id === renamingFileId;
                const status = saveStatuses[file._id];

                return (
                  <li
                    key={file._id}
                    onClick={() => setActiveFileId(file._id)}
                    className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'glass-strong text-[#fafafa] font-medium border border-cyan-400/30 shadow-[0_0_12px_rgba(0,240,255,0.12)]'
                        : 'text-[#a3a3a3] hover:bg-white/[0.04] hover:text-[#fafafa]'
                    }`}
                  >
                    {/* Active Bar indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(0,240,255,0.6)] transition-all duration-150"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                      <i
                        className={`text-sm ${
                          file.name.endsWith('.json')
                            ? 'ri-braces-line text-amber-400/80'
                            : file.name.endsWith('.md')
                            ? 'ri-markdown-line text-cyan-400/80'
                            : 'ri-file-code-line text-cyan-400/80'
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
                          className="w-full glass-input border-cyan-400/50 px-1.5 py-0.5 text-xs text-[#fafafa] rounded-md outline-none"
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
                            className="p-1 text-[#737373] hover:text-[#fafafa] rounded focus-ring"
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
                            className="p-1 text-[#737373] hover:text-red-400 rounded focus-ring"
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
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 group-hover:hidden" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs text-[#737373]">
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
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
              {newFileError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5" htmlFor="new-file-name">
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
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-[#fafafa] placeholder-[#737373] focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5" htmlFor="new-file-path">
              Path (Optional folder override)
            </label>
            <input
              id="new-file-path"
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="Defaults to file name (no leading slash)"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs text-[#fafafa] placeholder-[#737373] focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
            />
            <p className="mt-1 text-[11px] text-[#737373]">
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
