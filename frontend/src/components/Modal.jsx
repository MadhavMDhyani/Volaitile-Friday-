import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  className = '',
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Synchronize open / close lifecycle during render
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
    }
  }

  // Preserve previous active element on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Handle closing animation unmount delay
  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isClosing]);

  // Close on Escape key and trap focus inside modal
  useEffect(() => {
    if (!isRendered) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    // Auto-focus first input or button inside modal
    const focusTimer = setTimeout(() => {
      const focusable = modalRef.current?.querySelectorAll(
        'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), [href]'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRendered, onClose]);

  if (!isRendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-150 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} rounded-lg border border-[#262626] bg-[#111111] p-5 sm:p-6 text-[#fafafa] modal-shadow transition-all duration-150 ${
          isClosing ? 'animate-scale-out' : 'animate-scale-in'
        } ${className}`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-[#fafafa]">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#a3a3a3] transition-colors hover:bg-[#171717] hover:text-[#fafafa] focus-ring"
                aria-label="Close dialog"
              >
                <i className="ri-close-line text-lg" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
