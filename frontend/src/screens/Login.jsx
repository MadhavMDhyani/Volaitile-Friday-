import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import getErrorMessage from '../utils/getErrorMessage';
import Button from '../components/Button';
import Logo from '../components/Logo';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(UserContext);

  const from = location.state?.from?.pathname || '/dashboard';

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
      setErrorMessage(getErrorMessage(error, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 sm:px-6 sm:py-12 text-[#fafafa] flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl">
        <div className="grid w-full overflow-hidden rounded-2xl glass-liquid lg:grid-cols-[1.1fr_0.9fr] modal-shadow">
          {/* Brand Info Panel (Desktop) - 60ms stagger entrance */}
          <div className="hidden p-8 sm:p-10 lg:flex lg:flex-col lg:justify-between border-r border-white/10 bg-white/[0.02]">
            <div>
              <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
                <Logo size="md" to={null} />
              </div>

              <div className="mt-8">
                <h1
                  className="text-2xl font-bold leading-snug tracking-tight text-[#fafafa] animate-fade-up"
                  style={{ animationDelay: '60ms' }}
                >
                  Developer workspace for shared projects.
                </h1>
                <p
                  className="mt-3 text-sm leading-relaxed text-[#a3a3a3] animate-fade-up"
                  style={{ animationDelay: '120ms' }}
                >
                  Sign in to access your projects, edit files in the cloud IDE, and collaborate with your team.
                </p>
              </div>

              <ul
                className="mt-8 space-y-2.5 text-xs text-[#a3a3a3] animate-fade-up"
                style={{ animationDelay: '180ms' }}
              >
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Cloud file explorer with synchronized editor</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Friday AI assistant with Gemini intelligence</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Team room messaging and role permissions</span>
                </li>
              </ul>
            </div>

            <div
              className="mt-8 rounded-xl glass-input p-3 text-xs text-[#a3a3a3] font-mono animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >
              Secured with JWT authentication and strict access policies.
            </div>
          </div>

          {/* Form Panel - Fades in */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 animate-fade-in">
            {/* Mobile Brand Header */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Logo size="sm" to={null} />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-[#fafafa] sm:text-2xl">
                Sign in to workspace
              </h2>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Enter your credentials to continue.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-accent-deep bg-accent-tint/40 p-3 text-xs text-accent animate-fade-in"
              >
                <i className="ri-error-warning-line text-base leading-none mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Sign in error</p>
                  <p className="mt-0.5 text-[#A1A1A1]">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-accent hover:text-white p-0.5 focus-ring rounded"
                  aria-label="Dismiss error"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#a3a3a3]" htmlFor="email">
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
                  placeholder="name@company.com"
                  className="w-full glass-input px-3.5 py-2.5 text-sm text-[#fafafa] placeholder-[#737373] transition-colors duration-150 focus-ring"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#a3a3a3]" htmlFor="password">
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
                    placeholder="Enter password"
                    className="w-full glass-input pl-3.5 pr-10 py-2.5 text-sm text-[#fafafa] placeholder-[#737373] transition-colors duration-150 focus-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#a3a3a3] hover:text-[#fafafa] transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'ri-eye-off-line text-base' : 'ri-eye-line text-base'} />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={isSubmitting}
                >
                  Sign in
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-[#a3a3a3]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-accent underline hover:text-accent-hover focus-ring rounded transition-colors">
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