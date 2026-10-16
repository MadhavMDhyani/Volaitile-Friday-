import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ToastItem from '../components/Toast';
import { ToastContext } from './ToastContextDef';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, ...toast }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    custom: addToast,
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-3"
          aria-live="polite"
        >
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastItem toast={item} onDismiss={removeToast} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
