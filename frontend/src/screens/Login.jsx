import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  function submitHandler(e) {
    e.preventDefault();
    if (!email || !password) return;

    axios
      .post('/users/login', { email, password })
      .then((response) => {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        navigate('/');
      })
      .catch((error) => {
        console.error(error?.response?.data || error);
      });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#111827_45%,_#0f172a_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-gradient-to-br from-cyan-500/20 via-slate-900 to-violet-500/20 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
                Secure access
              </p>
              <h1 className="text-4xl font-semibold leading-tight">
                Welcome back. Sign in to continue your journey.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Access your account quickly with a polished, secure, and modern login experience.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Why users love it</p>
              <ul className="mt-2 space-y-2 text-slate-400">
                <li>• Fast authentication flow</li>
                <li>• Responsive dark theme</li>
                <li>• Simple account creation</li>
              </ul>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">Login</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Sign in to your account</h2>
              <p className="mt-2 text-sm text-slate-400">Enter your credentials to get started.</p>
            </div>

            <form onSubmit={submitHandler} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Sign in
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;