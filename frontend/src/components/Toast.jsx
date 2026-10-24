import { useState, useEffect, useRef } from 'react';

export const ToastItem = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(duration);

  useEffect(() => {
    if (isPaused) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const interval = 25; // 40fps progress tick

    const timer = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);
      setProgress((newRemaining / duration) * 100);

      if (newRemaining <= 0) {
        clearInterval(timer);
        onDismiss(toast.id);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      if (startTimeRef.current !== null) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
    };
  }, [isPaused, duration, onDismiss, toast.id]);

  const typeConfig = {
    success: {
      icon: 'ri-check-line text-[#c4b5a8]',
      border: 'border-white/10',
      bar: 'bg-[#c4b5a8]/60',
    },
    error: {
      icon: 'ri-error-warning-line text-accent',
      border: 'border-white/10',
      bar: 'bg-accent/80',
    },
    info: {
      icon: 'ri-information-line text-[#a89384]',
      border: 'border-white/10',
      bar: 'bg-[#a89384]/80',
    },
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative flex w-full max-w-sm overflow-hidden rounded-xl glass-strong p-3.5 text-sm text-[#f3e6da] modal-shadow animate-slide-in-up transition-transform duration-150 active:scale-[0.99] select-none`}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full items-start gap-3">
        <i className={`${config.icon} text-lg leading-tight mt-0.5`} />
        <div className="flex-1 pr-2">
          {toast.title && <div className="font-semibold text-xs text-[#f3e6da] mb-0.5">{toast.title}</div>}
          <div className="text-xs text-[#a89384] leading-snug break-words">{toast.message}</div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-[#a89384] hover:text-[#f3e6da] p-1 rounded-md hover:bg-white/8 transition-colors focus-ring"
          aria-label="Dismiss notification"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/8">
        <div
          className={`h-full ${config.bar} transition-[width] duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ToastItem;
