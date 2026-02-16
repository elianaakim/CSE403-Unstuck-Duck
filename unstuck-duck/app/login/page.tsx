'use client';

import { useState, SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp && !validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    // Simulate API call - replace with actual backend call
    setTimeout(() => {
      console.log('Form submitted:', { email, password, isSignUp });
      // alert(isSignUp ? 'Sign up successful! (Demo)' : 'Login successful! (Demo)');
      router.push('/home');
      setIsLoading(false);
    }, 1500);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 relative overflow-hidden px-4 py-8">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgb(231 229 228) 1px, transparent 1px), linear-gradient(90deg, rgb(231 229 228) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'gridSlide 20s linear infinite'
          }}
        />
        
        {/* Floating Bubbles */}
        <div 
          className="absolute w-[400px] h-[400px] -top-24 -right-24 rounded-full blur-[40px] opacity-100"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(59, 130, 246, 0.15))',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-[300px] h-[300px] -bottom-12 -left-12 rounded-full blur-[40px] opacity-100"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(59, 130, 246, 0.15))',
            animation: 'float 20s ease-in-out infinite',
            animationDelay: '-7s'
          }}
        />
        <div 
          className="absolute w-[350px] h-[350px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px] opacity-100"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(59, 130, 246, 0.15))',
            animation: 'float 20s ease-in-out infinite',
            animationDelay: '-14s'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[440px] animate-[slideUp_0.6s_ease-out]">
        {/* Header */}
        <div className="text-center mb-8 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
          <div className="text-6xl mb-2 inline-block animate-[bounce_2s_ease-in-out_infinite]">
            <Image
                        src='/duck.png'
                        alt="Duck Logo"
                        width={40}
                        height={40}
                        className="rounded-full mr-4"
                    />
          </div>
          <h1 className="text-4xl font-serif font-normal text-stone-900 mb-2 tracking-tight">
            Unstuck Duck
          </h1>
          <p className="text-base text-stone-500 font-normal">
            {isSignUp ? 'Start teaching your duck' : 'Welcome back!'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-stone-200 relative overflow-hidden animate-[fadeIn_0.8s_ease-out_0.4s_both]">
          {/* Card Glow Effect */}
          <div 
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
              animation: 'glow 8s ease-in-out infinite'
            }}
          />

          {/* Mode Toggle */}
          <div className="relative flex bg-stone-50 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => !isSignUp || toggleMode()}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${
                !isSignUp ? 'text-stone-900' : 'text-stone-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => isSignUp || toggleMode()}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${
                isSignUp ? 'text-stone-900' : 'text-stone-500'
              }`}
            >
              Sign Up
            </button>
            <div 
              className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-lg shadow-md transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isSignUp ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10">
            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-stone-900 mb-2 tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="your.email@example.com"
                disabled={isLoading}
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-base text-stone-900 bg-white transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-stone-400 placeholder:opacity-50 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-stone-200 focus:border-amber-500 focus:ring-amber-500/10'
                }`}
              />
              {errors.email && (
                <span className="block mt-2 text-sm text-red-500 animate-[shake_0.3s_ease]">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-stone-900 mb-2 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                disabled={isLoading}
                className={`w-full px-4 py-3.5 border-2 rounded-xl text-base text-stone-900 bg-white transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-stone-400 placeholder:opacity-50 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-stone-200 focus:border-amber-500 focus:ring-amber-500/10'
                }`}
              />
              {errors.password && (
                <span className="block mt-2 text-sm text-red-500 animate-[shake_0.3s_ease]">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Forgot Password */}
            {!isSignUp && (
              <div className="text-right mb-6">
                <a 
                  href="#" 
                  className="text-sm text-stone-500 hover:text-amber-500 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl text-base font-semibold transition-all duration-300 shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative text-center my-8">
            <span className="relative inline-block px-4 bg-white text-sm text-stone-500 z-10">
              or continue with
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-stone-200" />
          </div>

          {/* Social Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-white border-2 border-stone-200 rounded-xl text-sm font-semibold text-stone-900 transition-all duration-200 hover:border-stone-400 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-white border-2 border-stone-200 rounded-xl text-sm font-semibold text-stone-900 transition-all duration-200 hover:border-stone-400 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                <path
                  fill="currentColor"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              GitHub
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-[fadeIn_0.8s_ease-out_0.6s_both]">
          <p className="text-sm text-stone-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-stone-900 font-medium hover:text-amber-500 transition-colors duration-200">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-stone-900 font-medium hover:text-amber-500 transition-colors duration-200">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes glow {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.5;
          }
          50% {
            transform: translate(10%, 10%);
            opacity: 0.8;
          }
        }

        @keyframes gridSlide {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(40px, 40px);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}