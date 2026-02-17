'use client';

import { useState, SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';

    if (!password) newErrors.password = 'Password is required';
    else if (isSignUp && !validatePassword(password))
      newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
        console.log('Form submitted:', { email, password, isSignUp });
        router.push('/home');
        setIsLoading(false);
    }, 1500);

    // try {
    //   const response = await fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password, type: isSignUp ? 'signup' : 'login' }),
    //   });
    //   const data = await response.json();
    //   if (response.ok) {
    //     router.push('/');
    //   } else {
    //     setErrors({ email: data.message || 'Authentication failed. Please try again.' });
    //   }
    // } catch {
    //   setErrors({ email: 'An error occurred. Please check your connection and try again.' });
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const toggleMode = () => { setIsSignUp(!isSignUp); setErrors({}); setPassword(''); };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 font-sans overflow-hidden">

      {/* ── Navbar ── matches homepage */}
      <nav className="w-full px-8 py-5 flex items-center justify-between border-b border-white/10 bg-neutral-950/80 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">🦆</span>
          <span className="text-base font-bold tracking-tight text-white">Unstuck Duck</span>
        </Link>
      </nav>

      {/* ── Main ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">

        {/* Ambient glow blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #facc15, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }} />

        <div className="relative z-10 w-full max-w-[420px]">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3 inline-block" style={{ animation: 'duckBounce 2s ease-in-out infinite' }}>
              🦆
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-neutral-500">
              {isSignUp ? 'Start teaching your duck today' : 'Sign in to continue teaching'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Amber glow inside card */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none bg-amber-400" />

            {/* Mode Toggle */}
            <div className="relative flex bg-white/5 border border-white/10 rounded-xl p-1 mb-7">
              <button
                type="button"
                onClick={() => !isSignUp || toggleMode()}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${
                  !isSignUp ? 'text-white' : 'text-neutral-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => isSignUp || toggleMode()}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${
                  isSignUp ? 'text-white' : 'text-neutral-500'
                }`}
              >
                Sign Up
              </button>
              <div
                className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white/10 rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isSignUp ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10">

              {/* Email */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  className={`w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600 ${
                    errors.email
                      ? 'border-red-500/60 focus:ring-red-500/20'
                      : 'border-white/10 focus:border-amber-400/60 focus:ring-amber-400/10'
                  }`}
                />
                {errors.email && (
                  <span className="block mt-1.5 text-xs text-red-400" style={{ animation: 'shake 0.3s ease' }}>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="mb-5">
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                  disabled={isLoading}
                  className={`w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600 ${
                    errors.password
                      ? 'border-red-500/60 focus:ring-red-500/20'
                      : 'border-white/10 focus:border-amber-400/60 focus:ring-amber-400/10'
                  }`}
                />
                {errors.password && (
                  <span className="block mt-1.5 text-xs text-red-400" style={{ animation: 'shake 0.3s ease' }}>
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Forgot password */}
              {!isSignUp && (
                <div className="text-right mb-5">
                  <a href="#" className="text-xs text-neutral-500 hover:text-amber-400 transition-colors duration-200 font-medium">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-neutral-950 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  backgroundColor: '#facc15',
                  boxShadow: '0 4px 24px rgba(250, 204, 21, 0.3)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Create Account' : 'Sign In'} →</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative text-center my-6">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
              <span className="relative inline-block px-4 bg-transparent text-xs text-neutral-600 z-10">
                or continue with
              </span>
            </div>

            {/* Social buttons */}
            <div className="flex gap-3">
              {[
                {
                  label: 'Google',
                  icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ),
                },
                {
                  label: 'GitHub',
                  icon: (
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  ),
                },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-neutral-300 transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center mt-6 text-xs text-neutral-600 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-neutral-400 hover:text-amber-400 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-neutral-400 hover:text-amber-400 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* ── Footer ── matches homepage */}
      <footer className="w-full border-t border-white/10 px-10 py-4 flex items-center justify-between">
        <span className="text-xs text-neutral-600">© {new Date().getFullYear()} Unstuck Duck</span>
        <div className="flex gap-5">
          <a href="#" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">Privacy</a>
          <a href="#" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">Terms</a>
        </div>
      </footer>

      <style jsx>{`
        @keyframes duckBounce {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}