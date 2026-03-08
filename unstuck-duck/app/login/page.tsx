"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/supabase/authcontext";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, user } = useAuth();

  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("signup") === "true"
  );
  const { resolvedTheme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);
  useEffect(() => {
    if (user) router.push("/home");
  }, [user, router]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePassword = (p: string) => p.length >= 8;

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
        await signUp({ username, email, password, firstName, lastName });
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      setErrors({ email: error.message || "Authentication failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setPassword("");
    setUsername("");
    setFirstName("");
    setLastName("");
  };

  return (
    <>
      <style>{`
        @keyframes l-fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes l-bob {
          0%,100% { transform:translateY(0) rotate(-3deg); }
          50%     { transform:translateY(-10px) rotate(3deg); }
        }
        @keyframes l-shake {
          0%,100% { transform:translateX(0); }
          25%     { transform:translateX(-4px); }
          75%     { transform:translateX(4px); }
        }
        @keyframes l-spin { to { transform:rotate(360deg); } }

        .l-s1 { animation: l-fadeUp 0.5s 0.04s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s2 { animation: l-fadeUp 0.5s 0.10s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s3 { animation: l-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
        .l-bob { animation: l-bob 2.8s ease-in-out infinite; }
        .l-shake { animation: l-shake 0.3s ease; }
        .l-spin { animation: l-spin 0.8s linear infinite; }

        .l-field {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border2);
          border-left: 3px solid rgba(249,115,22,0.35);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          border-radius: 0;
        }
        .l-field::placeholder { color: rgba(80,76,68,0.5); }
        .l-field:focus {
          border-color: var(--acid);
          box-shadow: 0 0 0 1px var(--acid);
        }
        .l-field:disabled { opacity: 0.4; cursor: not-allowed; }
        .l-field.error {
          border-left-color: #ff6b6b;
          border-color: rgba(255,107,107,0.5);
        }
        .l-field.error:focus { border-color: #ff6b6b; box-shadow: 0 0 0 1px #ff6b6b; }

        .l-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
          display: block;
        }

        .l-toggle-btn {
          flex: 1;
          padding: 9px 0;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
        }

        .l-submit {
          width: 100%;
          padding: 14px 0;
          font-family: var(--font-display);
          font-size: 15px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: var(--acid);
          color: var(--black);
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .l-submit:hover:not(:disabled) {
          background: #fb923c;
          transform: translateY(-1px);
          box-shadow: 0 4px 0 rgba(249,115,22,0.3);
        }
        .l-submit:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
        .l-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "var(--black)",
          fontFamily: "var(--font-body)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Minimal top bar */}
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              letterSpacing: "0.05em",
              color: "var(--white)",
            }}
          >
            unstuck duck<span style={{ color: "var(--acid)" }}>.</span>
          </span>

          {/* Dark/Light toggle */}
          {mounted && (
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: resolvedTheme === "dark" ? "#f5f5f0" : "#444440",
                  transition: "color 0.2s",
                }}
              >
                Dark
              </span>
              <div
                style={{
                  position: "relative",
                  width: 44,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--card2)",
                  border: "1px solid var(--border2)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: resolvedTheme === "dark" ? 3 : "calc(100% - 19px)",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--acid)",
                    boxShadow: "0 0 6px rgba(249,115,22,0.5)",
                    transition: "left 0.25s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: resolvedTheme !== "dark" ? "#f5f5f0" : "#444440",
                  transition: "color 0.2s",
                }}
              >
                Light
              </span>
            </button>
          )}
        </div>

        {/* Main centered content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full" style={{ maxWidth: 400 }}>
            {/* Duck + heading */}
            <div className="l-s1 text-center mb-8">
              <div className="l-bob inline-block mb-4">
                <Image
                  src="/duck_l.png"
                  alt="Unstuck Duck"
                  width={72}
                  height={72}
                  draggable="false"
                />
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--acid)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {isSignUp ? "/ Create Account" : "/ Sign In"}
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(36px, 6vw, 52px)",
                  lineHeight: 0.9,
                  letterSpacing: "0.02em",
                  color: "var(--white)",
                }}
              >
                {isSignUp ? (
                  <>
                    WELCOME
                    <br />
                    <span style={{ color: "var(--acid)" }}>ABOARD.</span>
                  </>
                ) : (
                  <>
                    WELCOME
                    <br />
                    <span style={{ color: "var(--acid)" }}>BACK.</span>
                  </>
                )}
              </h1>
            </div>

            {/* Card */}
            <div
              className="l-s2"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderTop: "3px solid var(--acid)",
                padding: "24px 24px 20px",
              }}
            >
              {/* Mode toggle */}
              <div
                style={{
                  display: "flex",
                  border: "1px solid var(--border2)",
                  marginBottom: 24,
                  background: "var(--off)",
                }}
              >
                <button
                  type="button"
                  className="l-toggle-btn"
                  onClick={() => isSignUp && toggleMode()}
                  style={{
                    color: !isSignUp ? "var(--black)" : "var(--muted)",
                    background: !isSignUp ? "var(--acid)" : "transparent",
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="l-toggle-btn"
                  onClick={() => !isSignUp && toggleMode()}
                  style={{
                    color: isSignUp ? "var(--black)" : "var(--muted)",
                    background: isSignUp ? "var(--acid)" : "transparent",
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Sign up extra fields */}
                  {isSignUp && (
                    <>
                      <div>
                        <label className="l-label">Username</label>
                        <input
                          type="text"
                          className="l-field"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="choose_a_username"
                          disabled={isLoading}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div>
                          <label className="l-label">First Name</label>
                          <input
                            type="text"
                            className="l-field"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="l-label">Last Name</label>
                          <input
                            type="text"
                            className="l-field"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div>
                    <label className="l-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className={`l-field${errors.email ? " error" : ""}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <span
                        className="l-shake"
                        style={{
                          display: "block",
                          marginTop: 5,
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "#ff6b6b",
                          letterSpacing: "0.05em",
                        }}
                      >
                        ⚠ {errors.email}
                      </span>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="l-label">Password</label>
                    <input
                      id="password"
                      type="password"
                      className={`l-field${errors.password ? " error" : ""}`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors({ ...errors, password: undefined });
                      }}
                      placeholder={isSignUp ? "Min. 8 characters" : "••••••••"}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <span
                        className="l-shake"
                        style={{
                          display: "block",
                          marginTop: 5,
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "#ff6b6b",
                          letterSpacing: "0.05em",
                        }}
                      >
                        ⚠ {errors.password}
                      </span>
                    )}
                  </div>

                  {/* Forgot password */}
                  {!isSignUp && (
                    <div style={{ textAlign: "right", marginTop: -8 }}>
                      <a
                        href="#"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "var(--lo)",
                          letterSpacing: "0.1em",
                          textDecoration: "none",
                          textTransform: "uppercase",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#f97316")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--lo)")
                        }
                      >
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="l-submit"
                    disabled={isLoading}
                    style={{ marginTop: 4 }}
                  >
                    {isLoading ? (
                      <span
                        className="l-spin"
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(0,0,0,0.2)",
                          borderTop: "2px solid black",
                          borderRadius: "50%",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <>{isSignUp ? "Create Account" : "Sign In"} →</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            borderTop: "1px solid var(--border)",
            background: "var(--off)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--lo)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            © {new Date().getFullYear()} unstuck duck
          </span>
        </div>
      </div>
    </>
  );
}
