import { lazy, Suspense, useContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

// Lazy-load all screens
const Home = lazy(() => import('../screens/Home'));
const Login = lazy(() => import('../screens/Login'));
const Register = lazy(() => import('../screens/Register'));
const Project = lazy(() => import('../screens/Project'));

const ScreenFallback = () => (
  <div className="flex min-h-screen w-full flex-col bg-[#0a0a0a] p-6 text-[#fafafa]">
    <div className="flex h-12 items-center justify-between border-b border-[#262626] pb-3">
      <Skeleton width="120px" height="20px" />
      <Skeleton width="32px" height="32px" rounded="rounded-md" />
    </div>
    <div className="mt-8 space-y-4">
      <Skeleton width="40%" height="28px" />
      <Skeleton width="60%" height="16px" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <Skeleton height="160px" rounded="rounded-lg" />
        <Skeleton height="160px" rounded="rounded-lg" />
        <Skeleton height="160px" rounded="rounded-lg" />
      </div>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-[#fafafa] font-sans">
    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#262626] bg-[#111111] text-[#fafafa] mb-4">
      <i className="ri-compass-3-line text-2xl" />
    </div>
    <h1 className="text-xl font-bold tracking-tight text-[#fafafa] sm:text-2xl">
      Page Not Found
    </h1>
    <p className="mt-2 max-w-sm text-xs text-[#a3a3a3]">
      The requested route or workspace view does not exist.
    </p>
    <Link to="/" className="mt-6">
      <Button variant="primary" size="sm">
        Return to Dashboard
      </Button>
    </Link>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading, serverError, retryProfileFetch } = useContext(UserContext);
  const location = useLocation();

  if (loading) return <ScreenFallback />;

  if (serverError) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-[#fafafa] font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-400 mb-4">
          <i className="ri-wifi-off-line text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-[#fafafa]">Server Unreachable</h2>
        <p className="mt-2 max-w-sm text-xs text-[#a3a3a3]">{serverError}</p>
        <div className="mt-6">
          <Button variant="primary" size="sm" onClick={retryProfileFetch}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <ScreenFallback />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <PageTransition>
        <Suspense fallback={<ScreenFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <Project />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </BrowserRouter>
  );
};

export default AppRoutes;
