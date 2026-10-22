import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import getErrorMessage from '../utils/getErrorMessage';
import Button from '../components/Button';
import Logo from '../components/Logo';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { label: 'Weak', percent: 25 };
    if (score <= 50) return { label: 'Fair', percent: 50 };
    if (score <= 75) return { label: 'Good', percent: 75 };
    return { label: 'Strong', percent: 100 };
  };

  const strength = getPasswordStrength(password);

  async function submitHandler(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password.length < 8 || password.length > 72) {
      setErrorMessage('Password must be between 8 and 72 characters long.');
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
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to create account. Please try again.'));
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
                  Create an account to start collaborating.
                </h1>
                <p
                  className="mt-3 text-sm leading-relaxed text-[#a3a3a3] animate-fade-up"
                  style={{ animationDelay: '120ms' }}
                >
                  Set up your developer profile to create repositories, invite teammates, and run code reviews.
                </p>
              </div>

              <ul
                className="mt-8 space-y-2.5 text-xs text-[#a3a3a3] animate-fade-up"
                style={{ animationDelay: '180ms' }}
              >
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Unlimited projects with auto-seeded starter files</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Interactive code generation & AI security reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-accent text-sm" />
                  <span>Granular owner permissions and team controls</span>
                </li>
              </ul>
            </div>

            <div
              className="mt-8 rounded-xl glass-input p-3 text-xs text-[#a3a3a3] font-mono animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >
              Passwords are encrypted with bcrypt before saving.
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
                Create your account
              </h2>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Enter your details to initialize your workspace.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-accent-deep bg-accent-tint/40 p-3 text-xs text-accent animate-fade-in"
              >
                <i className="ri-error-warning-line text-base leading-none mt-0.5 text-accent" />
                <div className="flex-1">
                  <p className="font-semibold text-accent">Registration error</p>
                  <p className="mt-0.5 text-[#CECECE]">{errorMessage}</p>
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
                  placeholder="developer@company.com"
                  className="w-full glass-input px-3.5 py-2.5 text-sm text-[#fafafa] placeholder-[#737373] transition-colors duration-150 focus-ring"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#a3a3a3]" htmlFor="password">
                    Password
                  </label>
                  <span className="text-[11px] text-[#737373]">8–72 characters</span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
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

                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-[#737373]">
                      <span>Strength:</span>
                      <span className="font-mono text-[#fafafa]">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white transition-[width] duration-200"
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={isSubmitting}
                >
                  Create account
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-[#a3a3a3]">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-white underline hover:text-accent focus-ring rounded transition-colors">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;