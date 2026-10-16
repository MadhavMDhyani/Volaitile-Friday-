import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  description,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-[#a3a3a3] leading-relaxed">{message}</p>
        {description && (
          <div className="rounded-md border border-[#262626] bg-[#0a0a0a] p-3 text-xs text-[#737373] font-mono">
            {description}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
