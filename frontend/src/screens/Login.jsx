import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import getErrorMessage from '../utils/getErrorMessage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(UserContext);

  const from = location.state?.from?.pathname || '/';

  async function submitHandler(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/users/login', {
        email: email.trim(),
        password,
      });

      login(response.data.token, response.data.user);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to sign in. Please check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 text-stone-100 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="grid w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Brand Info Panel (Desktop) */}
          <div className="hidden bg-slate-900 p-8 sm:p-10 lg:flex lg:flex-col lg:justify-between border-r border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-500 font-mono text-sm font-bold text-slate-950">
                  VF
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">Volaitile Friday</h2>
                  <p className="text-xs text-slate-400 font-mono">Workspace</p>
                </div>
              </div>

              <div className="mt-8">
                <h1 className="text-2xl font-bold leading-snug text-white">
                  Developer workspace for shared projects.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Sign in to access your projects, review changes, and collaborate with your team.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
              Organize projects, manage team access, and coordinate code in one workspace.
            </div>
          </div>

          {/* Form Panel */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            {/* Mobile Brand Header */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500 font-mono text-xs font-bold text-slate-950">
                VF
              </div>
              <span className="text-base font-bold text-white">Volaitile Friday</span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white sm:text-2xl">Sign in to your workspace</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Pick up where you left off.</p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm text-red-200 animate-fade-in"
              >
                <div className="flex-1">
                  <p className="font-medium text-red-300">Authentication failed</p>
                  <p className="mt-0.5 text-red-200/90">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 hover:text-red-200 p-0.5 transition"
                  aria-label="Dismiss error"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-md border border-slate-700 bg-slate-800 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'ri-eye-off-line text-base' : 'ri-eye-line text-base'} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-base" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition underline-offset-4 hover:underline">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;