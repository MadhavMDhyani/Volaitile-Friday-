import { useState, useContext } from 'react';
import Modal from './Modal';
import Button from './Button';
import axios from '../config/axios';
import { useToast } from '../context/useToast';
import { UserContext } from '../context/UserContext';
import getErrorMessage from '../utils/getErrorMessage';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { user, login } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { label: 'Weak', percent: 25 };
    if (score <= 50) return { label: 'Fair', percent: 50 };
    if (score <= 75) return { label: 'Good', percent: 75 };
    return { label: 'Strong', percent: 100 };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please provide your current password');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError('New password must be between 8 and 72 characters');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put('/users/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.token) {
        login(res.data.token, user);
      }

      toast.success('Your password has been successfully updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-accent-deep bg-accent-tint/40 p-2.5 text-xs text-accent flex items-center gap-2">
            <i className="ri-error-warning-line text-sm" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#9D98AA] mb-1.5" htmlFor="current-pwd">
            Current Password
          </label>
          <input
            id="current-pwd"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full glass-input px-3.5 py-2 text-xs text-[#F5F3FF] placeholder-[#6C667C] focus-ring transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9D98AA] mb-1.5" htmlFor="new-pwd">
            New Password (8-72 characters)
          </label>
          <input
            id="new-pwd"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full glass-input px-3.5 py-2 text-xs text-[#F5F3FF] placeholder-[#6C667C] focus-ring transition-colors"
            placeholder="••••••••"
            minLength={8}
            maxLength={72}
            required
          />
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-[#6C667C]">
                <span>Strength:</span>
                <span className="font-mono text-[#F5F3FF]">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-200"
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9D98AA] mb-1.5" htmlFor="confirm-pwd">
            Confirm New Password
          </label>
          <input
            id="confirm-pwd"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full glass-input px-3.5 py-2 text-xs text-[#F5F3FF] placeholder-[#6C667C] focus-ring transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
