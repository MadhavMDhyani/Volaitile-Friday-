import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  async function submitHandler(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/users/register', {
        email: email.trim(),
        password,
      });

      login(response.data.token, response.data.user);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      const data = error?.response?.data;
      let msg = 'Failed to create account. Please try again.';

      if (typeof data?.errors === 'string') {
        msg = data.errors;
      } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
        msg = data.errors.map((err) => err.msg || err).join(', ');
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (error?.message && !error?.response) {
        msg = 'Unable to reach the server. Please check your backend connection.';
      }

      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.12),_transparent_50%),linear-gradient(135deg,_#030712_0%,_#0b1120_50%,_#070d19_100%)] px-4 py-8 sm:px-6 sm:py-12 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          {/* Brand & Showcase Panel (Desktop) */}
          <div className="hidden bg-gradient-to-br from-cyan-950/50 via-slate-900/90 to-violet-950/40 p-10 lg:flex lg:flex-col lg:justify-between border-r border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/25">
                  <i className="ri-flashlight-fill text-2xl text-slate-950" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Volaitile Friday</h2>
                  <p className="text-xs text-cyan-400 font-mono tracking-wider uppercase">Workspace Studio</p>
                </div>
              </div>

              <div className="mt-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Instant Onboarding
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white xl:text-4xl">
                  Build faster together in collaborative rooms.
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Create your developer account in seconds to orchestrate shared projects, communicate seamlessly, and accelerate deployment.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Everything you need</p>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <i className="ri-shield-keyhole-line text-cyan-400 text-sm font-bold" />
                  <span>Secure JWT token-based session management</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-team-line text-cyan-400 text-sm font-bold" />
                  <span>Effortless multi-user project collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-speed-up-line text-cyan-400 text-sm font-bold" />
                  <span>Ultra-low latency interface optimized for engineers</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form Panel */}
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            {/* Mobile Brand Header */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 shadow-md shadow-cyan-500/25">
                <i className="ri-flashlight-fill text-xl text-slate-950" />
              </div>
              <span className="text-lg font-bold text-white">Volaitile Friday</span>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Registration</p>
              <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Create your account</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">Join Volaitile Friday and start collaborating immediately.</p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-200 animate-fade-in"
              >
                <i className="ri-error-warning-fill text-lg text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-300">Registration error</p>
                  <p className="mt-0.5 text-red-200/90">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-red-400 hover:text-red-200 p-1 rounded-md transition"
                  aria-label="Dismiss error"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-4 sm:space-y-5" noValidate>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <i className="ri-mail-line text-base" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-medium text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <i className="ri-lock-line text-base" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'ri-eye-off-line text-base' : 'ri-eye-line text-base'} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || password.length < 6}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-cyan-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-base" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <i className="ri-user-add-line text-base" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-5 text-center text-xs sm:text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;