import { useState, useRef, useEffect, useContext } from 'react';
import { UserContext } from '../context/user.context';
import ChangePasswordModal from './ChangePasswordModal';

export const AccountMenu = () => {
  const { user, logout } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initial = (user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-md border border-[#262626] bg-[#111111] px-2.5 py-1.5 text-xs text-[#fafafa] transition-colors hover:border-[#404040] hover:bg-[#171717] focus-ring"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Account options"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#fafafa] font-mono text-[10px] font-bold text-[#0a0a0a]">
            {initial}
          </div>
          <span className="hidden sm:inline font-medium max-w-[150px] truncate text-left">
            {user?.email || 'Account'}
          </span>
          <i
            className={`ri-arrow-down-s-line text-[#737373] text-sm transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#fafafa]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-1.5 w-56 rounded-md border border-[#262626] bg-[#111111] py-1 text-xs text-[#fafafa] modal-shadow animate-scale-in z-40"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="border-b border-[#262626] px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-[#737373]">Signed in as</span>
              <span className="block font-medium truncate text-[#fafafa] mt-0.5">{user?.email}</span>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[#a3a3a3] transition-colors hover:bg-[#171717] hover:text-[#fafafa] focus-ring"
                role="menuitem"
              >
                <i className="ri-lock-password-line text-sm" />
                <span>Change password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10 focus-ring"
                role="menuitem"
              >
                <i className="ri-logout-box-r-line text-sm" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default AccountMenu;
