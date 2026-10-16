import { BrowserRouter, Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../context/user.context';
import Home from '../screens/Home';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Project from '../screens/Project';

const AppLoadingScreen = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
    <div className="flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500" />
    </div>
    <div className="mt-4 flex flex-col items-center text-center">
      <span className="font-mono text-sm font-semibold tracking-wide text-white">Volaitile Friday</span>
      <p className="mt-1 text-xs text-slate-400">Loading workspace...</p>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
      <i className="ri-compass-3-line text-2xl text-cyan-400" />
    </div>
    <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Page Not Found</h1>
    <p className="mt-2 max-w-sm text-xs sm:text-sm text-slate-400">
      The workspace view or route you requested could not be found.
    </p>
    <Link
      to="/"
      className="mt-5 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs sm:text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
    >
      <i className="ri-home-4-line text-base" />
      <span>Return to Dashboard</span>
    </Link>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading, serverError, retryProfileFetch } = useContext(UserContext);
  const location = useLocation();

  if (loading) return <AppLoadingScreen />;

  if (serverError) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          <i className="ri-wifi-off-line text-2xl" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Server Unreachable</h2>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">{serverError}</p>
        <button
          type="button"
          onClick={retryProfileFetch}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
        >
          <i className="ri-refresh-line text-sm" />
          <span>Retry Connection</span>
        </button>
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
  if (loading) return <AppLoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default AppRoutes;
