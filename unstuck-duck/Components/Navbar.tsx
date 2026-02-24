"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/backend/src/supabase/authcontext";
import { Url } from "next/dist/shared/lib/router/router";

const navItems = [
  { id: "duck", label: "The Duck", href: "/duck" },
  { id: "lake", label: "The Lake", href: "/lake" },
  { id: "History", label: "History", href: "/history" },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const isActive = (path: Url) => pathname === path;
  const isDark = resolvedTheme === "dark";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav
      suppressHydrationWarning
      className="pb-4 pt-2 flex justify-between items-center"
    >
      {/* Logo */}
      <Link
        href="/home"
        className="ml-4 text-lg md:text-3xl font-bold hover:text-gray-400"
      >
        unstuck duck
      </Link>

      {/* Nav links */}
      <ul className="flex justify-end items-center gap-4">
        {navItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={
                `${isActive(item.href) ? "text-spotify-green" : ""}` +
                " hover:text-gray-600"
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right side: theme toggle + avatar */}
      <div className="mr-4 flex items-center gap-3">
        {/* Light/dark mode toggle, disabled for now
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`
            relative w-14 h-7 rounded-full transition-colors duration-300
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            ${isDark ? "bg-neutral-700" : "bg-stone-200"}
          `}
        >
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none">
            🌙
          </span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none">
            ☀️
          </span>
          <span
            className={`
              absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300
              ${
                isDark
                  ? "left-0.5 bg-neutral-900 border border-white/20"
                  : "left-[calc(100%-1.625rem)] bg-white border border-stone-300"
              }
            `}
          />
        </button> */}

        {/* Globe / avatar */}
        <button 
          onClick={handleSignOut}
          className="cursor-pointer hover:opacity-70 transition-opacity"
          aria-label="Sign out"
        >
          <Image
            src="/globe.svg"
            alt="Sign out"
            width={40}
            height={40}
          />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
