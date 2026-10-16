import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import AddMemberModal from './AddMemberModal';
import axios from '../../config/axios';
import { useToast } from '../../context/ToastContext';
import getErrorMessage from '../../utils/getErrorMessage';

export const MembersDrawer = ({
  isOpen,
  onClose,
  project,
  currentUserId,
  onUpdateMembers,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Remove member state
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isProcessingRemoval, setIsProcessingRemoval] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Handle Escape key
  useEffect(() => {
    if (!isRendered) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isAddModalOpen && !memberToRemove && !isLeaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, isAddModalOpen, memberToRemove, isLeaving, onClose]);

  if (!isRendered || !project) return null;

  const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
  const isOwner = ownerId === currentUserId;
  const members = project.users || [];

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const targetId = memberToRemove._id ? memberToRemove._id.toString() : memberToRemove.toString();

    try {
      setIsProcessingRemoval(true);
      const res = await axios.delete(`/projects/${project._id}/members/${targetId}`);
      toast.success('Member removed from project');

      const updated = res.data?.project;
      if (updated && typeof onUpdateMembers === 'function') {
        onUpdateMembers(updated.users || []);
      }
      setMemberToRemove(null);
    } catch (err) {
      console.error('Remove member error:', err);
      toast.error(getErrorMessage(err, 'Failed to remove member'));
    } finally {
      setIsProcessingRemoval(false);
    }
  };

  const handleLeaveProject = async () => {
    try {
      setIsProcessingRemoval(true);
      await axios.delete(`/projects/${project._id}/members/${currentUserId}`);
      toast.success('You have left the project');
      navigate('/');
    } catch (err) {
      console.error('Leave project error:', err);
      toast.error(getErrorMessage(err, 'Failed to leave project'));
    } finally {
      setIsProcessingRemoval(false);
      setIsLeaving(false);
    }
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 transition-opacity duration-250"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <aside
          className={`fixed inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-[#262626] bg-[#111111] p-5 text-[#fafafa] modal-shadow transition-transform duration-300 ease-out ${
            isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
          }`}
          role="dialog"
          aria-label="Project Members"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#fafafa]">
                Project Members
              </h2>
              <p className="text-[11px] text-[#737373]">
                {members.length} / 25 collaborators
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#a3a3a3] hover:bg-[#171717] hover:text-[#fafafa] transition-colors focus-ring"
              aria-label="Close members drawer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Add Member Action */}
          <div className="my-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              icon={<i className="ri-user-add-line text-xs" />}
              className="w-full justify-center"
            >
              Add Collaborators
            </Button>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {members.map((member) => {
              const mId = member?._id ? member._id.toString() : member.toString();
              const isMemberOwner = mId === ownerId;
              const isCurrentUser = mId === currentUserId;
              const email = member?.email || 'User';

              return (
                <div
                  key={mId}
                  className="flex items-center justify-between rounded-md border border-[#262626] bg-[#0a0a0a] p-2.5 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#171717] font-mono text-[10px] font-bold text-[#fafafa] border border-[#262626]">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <span className="truncate block text-[#fafafa]">
                        {email}
                        {isCurrentUser && <span className="text-[#737373] ml-1">(you)</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMemberOwner ? (
                      <span className="rounded border border-[#404040] bg-[#171717] px-1.5 py-0.5 text-[9px] font-mono text-[#a3a3a3] uppercase">
                        Owner
                      </span>
                    ) : isOwner ? (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        className="p-1 text-[#737373] hover:text-red-400 rounded focus-ring transition-colors"
                        title="Remove member"
                        aria-label={`Remove ${email}`}
                      >
                        <i className="ri-user-unfollow-line text-xs" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer: Leave Project option for non-owners */}
          {!isOwner && (
            <div className="border-t border-[#262626] pt-4 mt-auto">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsLeaving(true)}
                icon={<i className="ri-logout-box-r-line text-xs" />}
                className="w-full justify-center"
              >
                Leave Project
              </Button>
            </div>
          )}
        </aside>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={project._id}
        existingMembers={members}
        onMembersAdded={(newUsers) => {
          if (typeof onUpdateMembers === 'function') {
            onUpdateMembers(newUsers);
          }
        }}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.email || 'this user'} from the project? They will lose access to all files and room messages.`}
        confirmText="Remove"
        confirmVariant="danger"
        loading={isProcessingRemoval}
      />

      {/* Leave Project Confirmation */}
      <ConfirmDialog
        isOpen={isLeaving}
        onClose={() => setIsLeaving(false)}
        onConfirm={handleLeaveProject}
        title="Leave Project"
        message="Are you sure you want to leave this project workspace? You will need an invitation from the owner to rejoin."
        confirmText="Leave Project"
        confirmVariant="danger"
        loading={isProcessingRemoval}
      />
    </>,
    document.body
  );
};

export default MembersDrawer;
