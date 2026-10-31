import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Background3D from './components/Background3D';
import { UserProvider } from './context/user.context';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

export const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <Background3D />
          <OfflineBanner />
          <AppRoutes />
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;