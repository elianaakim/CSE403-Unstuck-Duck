"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/supabase/authcontext";

const navItems = [
  { id: "duck", label: "The Duck", href: "/duck" },
  { id: "lake", label: "The Lake", href: "/lake" },
  { id: "history", label: "History", href: "/history" },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive = (path: string) => pathname === path;
  const isDark = resolvedTheme === "dark";

  const handleSignOut = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <style>{`
        .nav-link {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          text-decoration: none;
          letter-spacing: 0.03em;
          padding: 4px 0;
          position: relative;
          transition: color 0.15s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--acid);
          transition: width 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active::after { width: 100%; background: var(--acid); }

        .nav-signout {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: none;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 0;
        }
        /* Dark mode hover */
        .nav-signout.dark-mode:hover {
          color: #f5f5f0;
          border-color: rgba(255,255,255,0.2);
          background: rgba(128,128,128,0.08);
        }
        /* Light mode hover */
        .nav-signout.light-mode:hover {
          color: #1a1a1a;
          border-color: rgba(0,0,0,0.3);
          background: rgba(0,0,0,0.05);
        }

        /* Toggle pill */
        .nav-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .nav-toggle-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: color 0.2s;
          user-select: none;
        }
        .nav-toggle-track {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 999px;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .nav-toggle-track:hover { border-color: var(--acid); }
        .nav-toggle-thumb {
          position: absolute;
          top: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--acid);
          transition: left 0.25s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 0 6px rgba(249,115,22,0.5);
        }
        .nav-toggle-thumb.dark  { left: 3px; }
        .nav-toggle-thumb.light { left: calc(100% - 19px); }
      `}</style>

      <nav
        suppressHydrationWarning
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: isDark 
            ? "rgba(8,8,8,0.92)" 
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: isDark 
            ? "1px solid rgba(255,255,255,0.08)" 
            : "1px solid rgba(0,0,0,0.08)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {/* Logo */}
        <Link
          href="/home"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: "0.05em",
            color: isDark ? "#f5f5f0" : "#1a1a1a",
            textDecoration: "none",
            lineHeight: 1,
            transition: "color 0.3s",
          }}
        >
          unstuck duck
          <span style={{ color: "var(--acid)" }}>.</span>
        </Link>

        {/* Nav links */}
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {navItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`nav-link${isActive(item.href) ? " active" : ""}`}
                style={{ 
                  color: isActive(item.href) 
                    ? (isDark ? "#f5f5f0" : "#1a1a1a")
                    : (isDark ? "#666660" : "#737373")
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* DARK / LIGHT pill toggle */}
          {mounted && (
            <button
              className="nav-toggle"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <span
                className="nav-toggle-label"
                style={{ 
                  color: isDark 
                    ? "#f5f5f0" 
                    : "#bdbdb7" 
                }}
              >
                Dark
              </span>
              <div 
                className="nav-toggle-track"
                style={{
                  background: isDark ? "#1a1a1a" : "#e5e5e5",
                  border: isDark 
                    ? "1px solid rgba(255,255,255,0.15)" 
                    : "1px solid rgba(0,0,0,0.15)",
                }}
              >
                <div
                  className={`nav-toggle-thumb ${isDark ? "dark" : "light"}`}
                />
              </div>
              <span
                className="nav-toggle-label"
                style={{ 
                  color: !isDark 
                    ? "#1a1a1a" 
                    : "#444440" 
                }}
              >
                Light
              </span>
            </button>
          )}

          {/* Sign out */}
          <button
            className={`nav-signout ${isDark ? "dark-mode" : "light-mode"}`}
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{ 
              color: isDark ? "#bdbdb7" : "#737373",
              border: isDark 
                ? "1px solid rgba(255,255,255,0.2)" 
                : "1px solid rgba(0,0,0,0.15)",
            }}
          >
            Sign out ↗
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;