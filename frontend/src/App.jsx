import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import { UserProvider } from './context/user.context';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

const Background3D = lazy(() => import('./components/Background3D'));

export const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <Suspense fallback={null}>
            <Background3D />
          </Suspense>
          <OfflineBanner />
          <AppRoutes />
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;