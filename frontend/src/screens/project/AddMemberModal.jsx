import { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import axios from '../../config/axios';
import { useToast } from '../../context/useToast';
import getErrorMessage from '../../utils/getErrorMessage';

export const AddMemberModal = ({
  isOpen,
  onClose,
  projectId,
  existingMembers = [],
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState('');

  const debounceTimerRef = useRef(null);
  const toast = useToast();

  const existingMemberIds = new Set(
    existingMembers.map((m) => (m?._id ? m._id.toString() : m.toString()))
  );

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUserIds(new Set());
    setSearchError('');
    onClose();
  };

  // Debounced search on query change
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!isOpen || trimmed.length < 3) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError('');
        const res = await axios.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
        const found = res.data?.users || [];
        setSearchResults(found);
      } catch (err) {
        console.error('Search users error:', err);
        setSearchError(getErrorMessage(err, 'Failed to search users'));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isOpen]);

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleAddMembers = async () => {
    const userIdsArray = Array.from(selectedUserIds);
    if (userIdsArray.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await axios.put('/projects/add-user', {
        projectId,
        users: userIdsArray,
      });

      const updatedProject = res.data?.project;
      toast.success(`Added ${userIdsArray.length} member(s) to project`);

      if (typeof onMembersAdded === 'function') {
        onMembersAdded(updatedProject?.users || []);
      }
      handleClose();
    } catch (err) {
      console.error('Add user error:', err);
      const msg = getErrorMessage(err, 'Failed to add members to project');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Collaborators" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-[#a89384] mb-1.5" htmlFor="member-search">
            Search Users by Email
          </label>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-accent/70" />
            <input
              id="member-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length < 3) {
                  setSearchResults([]);
                  setSearchError('');
                }
              }}
              placeholder="Type at least 3 characters..."
              className="w-full rounded-xl glass-input pl-9 pr-3.5 py-2.5 text-xs text-[#f3e6da] placeholder-[#6e5d50] transition-all font-mono"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
            <p className="mt-1.5 text-[11px] text-[#6e5d50]">
              Type at least 3 characters to search.
            </p>
          )}
        </div>

        {/* Error message */}
        {searchError && (
          <div className="rounded-xl border border-accent-deep bg-accent-tint/40 p-2.5 text-xs text-accent">
            {searchError}
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-52 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/40 p-1.5 space-y-1">
          {searchQuery.trim().length >= 3 && !isSearching && searchResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#6e5d50]">
              No users found matching &quot;{searchQuery}&quot;
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((u) => {
              const alreadyMember = existingMemberIds.has(u._id.toString());
              const isSelected = selectedUserIds.has(u._id.toString());

              return (
                <div
                  key={u._id}
                  onClick={() => !alreadyMember && toggleSelectUser(u._id.toString())}
                  className={`flex items-center justify-between rounded-lg p-2 text-xs transition-all duration-150 ${
                    alreadyMember
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'glass-strong border border-accent/40 text-[#f3e6da] cursor-pointer shadow-[0_0_8px_rgb(var(--accent-rgb)/0.15)]'
                      : 'hover:bg-white/[0.05] text-[#a89384] hover:text-[#f3e6da] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.08] text-[10px] font-mono text-[#f3e6da] border border-white/[0.1]">
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate font-medium">{u.email}</span>
                  </div>

                  <div>
                    {alreadyMember ? (
                      <span className="text-[10px] text-[#6e5d50] uppercase font-mono">Member</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u._id.toString())}
                        className="rounded border-white/20 bg-white/[0.06] text-accent focus-ring cursor-pointer"
                        aria-label={`Select ${u.email}`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-[#6e5d50]">
              Search for teammates by email to add them.
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-3.5">
          <span className="text-xs text-[#a89384]">
            {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddMembers}
              disabled={selectedUserIds.size === 0 || isSubmitting}
              loading={isSubmitting}
            >
              Add Selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
