import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import AuroraBackground from './components/AuroraBackground';
import { UserProvider } from './context/user.context';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

export const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <AuroraBackground />
          <OfflineBanner />
          <AppRoutes />
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;