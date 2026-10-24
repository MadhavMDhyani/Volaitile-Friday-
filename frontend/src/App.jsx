import { BrowserRouter, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import CinderBackground from './components/CinderBackground';
import FpsProbe from './components/FpsProbe';
import { UserProvider } from './context/user.context';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

const DynamicCinder = () => {
  const location = useLocation();
  // 1 on landing/login/register/dashboard, 0.4 on /project/*
  const intensity = location.pathname.startsWith('/project') ? 0.4 : 1;
  return <CinderBackground intensity={intensity} />;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <ToastProvider>
          <BrowserRouter>
            <DynamicCinder />
            <OfflineBanner />
            <AppRoutes />
            <FpsProbe />
          </BrowserRouter>
        </ToastProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

export default App;