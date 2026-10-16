import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../context/user.context';
import Home from '../screens/Home';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Project from '../screens/Project';

const AppLoadingScreen = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
    <div className="relative flex items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
      <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 shadow-lg shadow-cyan-500/20">
        <i className="ri-flashlight-fill text-lg text-cyan-400" />
      </div>
    </div>
    <div className="mt-6 flex flex-col items-center text-center">
      <h2 className="text-base font-semibold tracking-wide text-white">Volaitile Friday</h2>
      <p className="mt-1 text-xs text-slate-400">Initializing your collaborative workspace...</p>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-cyan-950/50">
      <i className="ri-compass-3-line text-4xl text-cyan-400" />
    </div>
    <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">404 - Page Not Found</h1>
    <p className="mt-2 max-w-md text-sm text-slate-400">
      The workspace view or route you requested could not be found or may have moved.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 focus-ring"
    >
      <i className="ri-home-4-line text-base" />
      <span>Return to Dashboard</span>
    </Link>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
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
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/project" element={<ProtectedRoute><Project /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
