"use client";

import Link from "next/link";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
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

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
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
          color: var(--muted);
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
        .nav-link:hover { color: var(--white); }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active {
          color: var(--white);
        }
        .nav-link.active::after { width: 100%; background: var(--acid); }

        .nav-signout {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          background: none;
          border: 1px solid var(--border);
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 0;
        }
        .nav-signout:hover {
          color: var(--white);
          border-color: var(--border2);
          background: rgba(255,255,255,0.04);
        }
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
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <Link
          href="/home"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            letterSpacing: "0.05em",
            color: "var(--white)",
            textDecoration: "none",
            lineHeight: 1,
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
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Sign out */}
        <button
          className="nav-signout"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          Sign out ↗
        </button>
      </nav>
    </>
  );
};

export default Navbar;
