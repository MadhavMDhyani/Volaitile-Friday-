import { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
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
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-[#F5F3FF] transition-all hover:border-white/18 hover:bg-white/[0.08] backdrop-blur-md focus-ring shadow-[inset_0_1px_0_rgba(245, 243, 255, 0.12)]"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Account options"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent font-mono text-[10px] font-bold text-[#18102B]">
            {initial}
          </div>
          <span className="hidden sm:inline font-mono font-medium max-w-[150px] truncate text-left">
            {user?.email || 'Account'}
          </span>
          <i
            className={`ri-arrow-down-s-line text-[#9D98AA] text-sm transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#F5F3FF]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-xl bg-[#211737] border border-white/15 py-1.5 text-xs text-[#F5F3FF] modal-shadow animate-scale-in z-40"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="border-b border-white/8 px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-[#6C667C]">Signed in as</span>
              <span className="block font-mono text-xs font-medium truncate text-[#F5F3FF] mt-0.5">{user?.email}</span>
            </div>

            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[#9D98AA] transition-colors hover:bg-white/[0.06] hover:text-[#F5F3FF] focus-ring"
                role="menuitem"
              >
                <i className="ri-dashboard-line text-sm" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[#9D98AA] transition-colors hover:bg-white/[0.06] hover:text-[#F5F3FF] focus-ring"
                role="menuitem"
              >
                <i className="ri-folder-3-line text-sm" />
                <span>Projects</span>
              </Link>

              <div className="my-1 border-t border-white/8" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[#9D98AA] transition-colors hover:bg-white/[0.06] hover:text-[#F5F3FF] focus-ring"
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
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-accent transition-colors hover:bg-accent-tint/40 focus-ring"
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
