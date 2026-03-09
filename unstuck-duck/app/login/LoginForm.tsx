"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/supabase/authcontext";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, user } = useAuth(); // Get auth functions

  // Check if we should show signup mode from URL
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("signup") === "true"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email))
      newErrors.email = "Please enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (isSignUp && !validatePassword(password))
      newErrors.password = "Password must be at least 8 characters";

    if (isSignUp) {
      if (!username) newErrors.email = "Username is required";
      if (!firstName) newErrors.email = "First name is required";
      if (!lastName) newErrors.email = "Last name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp({
          username,
          email,
          password,
          firstName,
          lastName,
        });
      } else {
        await signIn(email, password);
      }
      // router.push("/home");
    } catch (error: any) {
      setErrors({ email: error.message || "Authentication failed" });
    } finally {
      setIsLoading(false);
    }
  };

  // const toggleMode = () => { setIsSignUp(!isSignUp); setErrors({}); setPassword(''); }; // OLD
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setPassword("");
    // Reset signup fields
    setUsername("");
    setFirstName("");
    setLastName("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 font-sans overflow-hidden">
      {/* ── Main ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Ambient glow blobs */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #facc15, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #38bdf8, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="text-6xl mb-3 inline-block"
              style={{ animation: "duckBounce 2s ease-in-out infinite" }}
            >
              <Image
                src="/duck.png"
                alt="Unstuck Duck Logo"
                width={50}
                height={50}
                draggable="false"
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h1>
            <p className="text-sm text-neutral-500">
              {isSignUp
                ? "Start teaching your duck today"
                : "Sign in to continue teaching"}
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
                  !isSignUp ? "text-white" : "text-neutral-500"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => isSignUp || toggleMode()}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 ${
                  isSignUp ? "text-white" : "text-neutral-500"
                }`}
              >
                Sign Up
              </button>
              <div
                className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white/10 rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isSignUp ? "translate-x-full" : "translate-x-0"
                }`}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10">
              {/* SIGN-UP FIELDS - ADD THIS ENTIRE SECTION */}
              {isSignUp && (
                <>
                  {/* Username */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      disabled={isLoading}
                      className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                    />
                  </div>

                  {/* First & Last Name - side by side */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        disabled={isLoading}
                        className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-7">
                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-widest">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600"
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-black bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
