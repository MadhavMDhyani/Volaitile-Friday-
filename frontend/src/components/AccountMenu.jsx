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
          className="flex items-center gap-2 rounded-full border border-glass-border bg-glass-bg px-2.5 py-1.5 text-xs text-white transition-all hover:border-accent hover:bg-white/[0.10] focus-ring backdrop-blur-sm"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Account options"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-medium text-[#070707]">
            {initial}
          </div>
          <span className="hidden sm:inline font-mono font-medium max-w-[150px] truncate text-left">
            {user?.email || 'Account'}
          </span>
          <i
            className={`ri-arrow-down-s-line text-text-muted text-sm transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-2xl tile bg-[#070707]/90 backdrop-blur-xl border border-glass-border py-1.5 text-xs text-white modal-shadow animate-scale-in z-40"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="border-b border-white/8 px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.35)]">Signed in as</span>
              <span className="block font-mono text-xs font-medium truncate text-white mt-0.5">{user?.email}</span>
            </div>

            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[rgba(255,255,255,0.55)] transition-colors hover:bg-white/[0.06] hover:text-white focus-ring"
                role="menuitem"
              >
                <i className="ri-dashboard-line text-sm" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[rgba(255,255,255,0.55)] transition-colors hover:bg-white/[0.06] hover:text-white focus-ring"
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
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[rgba(255,255,255,0.55)] transition-colors hover:bg-white/[0.06] hover:text-white focus-ring"
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
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[rgba(255,255,255,0.55)] transition-colors hover:bg-[rgba(18,220,239,0.08)] hover:text-[#12DCEF] focus-ring"
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

