import { useState, useEffect } from 'react';
import Button from './Button';

export const OfflineBanner = ({ onRetry }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      className="sticky top-0 z-50 flex items-center justify-between border-b border-accent-deep bg-accent-tint/40 px-4 py-2 text-xs text-[#F5F3FF] font-sans"
      aria-label="Network status banner"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-accent" />
        <span className="font-medium">You are currently offline.</span>
        <span className="hidden sm:inline text-[#9D98AA]">
          Changes will not synchronize with the cloud until your connection is restored.
        </span>
      </div>

      <Button
        variant="secondary"
        size="xs"
        onClick={() => {
          if (navigator.onLine) setIsOffline(false);
          if (typeof onRetry === 'function') onRetry();
        }}
      >
        Retry
      </Button>
    </aside>
  );
};

export default OfflineBanner;

