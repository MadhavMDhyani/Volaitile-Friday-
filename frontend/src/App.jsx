import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import CinderBackground from './components/CinderBackground';
import { UserProvider } from './context/user.context';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';
import axiosInstance from './config/axios';

/**
 * Fire-and-forget pre-warm ping to /health/ping.
 * Runs at most once per 10 minutes via sessionStorage.
 * Errors are silently ignored — this is purely for reducing cold-start latency.
 */
function usePreWarmPing() {
  useEffect(() => {
    const STORAGE_KEY = 'prewarm_last_ping';
    const TEN_MINUTES = 10 * 60 * 1000;

    try {
      const lastPing = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
      if (Date.now() - lastPing < TEN_MINUTES) return;

      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));

      // Fire-and-forget — no await, no error propagation
      axiosInstance.get('/health/ping').catch(() => {});
    } catch {
      // sessionStorage may be unavailable (private browsing, security policy) — ignore
    }
  }, []); // runs once on first mount
}

export const App = () => {
  usePreWarmPing();

  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <CinderBackground />
          <OfflineBanner />
          <AppRoutes />
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;