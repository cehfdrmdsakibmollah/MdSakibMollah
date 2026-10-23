
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowUpRight,
  Code2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";

import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./providers";

const links = [
  ["Home", "/"],
  ["Work", "/projects"],
  ["Services", "/services"],
  ["About", "/#about"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const { user, setAuthOpen } = useAuth();

  // Prevent server/client hydration mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setOpen(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 glass">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-20 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link
          href="/"
          aria-label="MD Sakib Mollah home"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 shrink-0"
        >
          <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white grid place-items-center shadow-glow">
            <Code2 size={23} />
          </span>

          <span className="font-display font-bold tracking-tight leading-tight text-base">
            SAKIB<span className="text-blue-500">.</span>

            <span className="block text-[10px] font-medium tracking-[.23em] muted">
              MOLLAH / DEV
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex gap-7 items-center"
        >
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm muted hover:text-blue-500 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">

          <button type="button"
            onClick={()=>window.dispatchEvent(new Event('portfolio:open-search'))}
            aria-label="Search portfolio (Ctrl+K)"
            title="Search projects and pages (Ctrl+K)"
            className="surface h-10 rounded-xl px-3 flex items-center gap-2 hover:text-blue-500 transition-colors">
            <Search size={18}/>
            <span className="hidden xl:inline text-xs muted">Search</span>
            <kbd className="hidden xl:inline text-[10px] opacity-60 border rounded px-1.5 py-0.5">⌘ K</kbd>
          </button>

          {/* Hydration-safe theme toggle */}
          <button
            type="button"
            title="Toggle light or dark mode"
            aria-label="Toggle light or dark mode"
            className="h-10 w-10 surface rounded-xl grid place-items-center hover:text-blue-500"
            onClick={toggleTheme}
            disabled={!mounted}
          >
            {!mounted ? (
              <span
                aria-hidden="true"
                className="block h-[19px] w-[19px]"
              />
            ) : resolvedTheme === "dark" ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          {/* Authentication controls */}
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:grid h-10 w-10 surface rounded-xl place-items-center"
                title="My dashboard"
                aria-label="My dashboard"
              >
                <LayoutDashboard size={19} />
              </Link>

              <button
                type="button"
                className="hidden sm:grid h-10 w-10 surface rounded-xl place-items-center"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void handleSignOut()}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm surface hover:text-blue-500"
            >
              <LogIn size={16} />
              Client login
            </button>
          )}

          {/* Hire me */}
          <Link
            href="/contact"
            className="hidden md:inline-flex gap-2 items-center rounded-full bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-sm font-semibold"
          >
            Hire Me
            <ArrowUpRight size={16} />
          </Link>

          {/* Mobile menu */}
          <button
            type="button"
            className="lg:hidden surface h-10 w-10 grid place-items-center rounded-xl"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((previous) => !previous)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile navigation links */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-white/10 px-6 pb-6 pt-4 flex flex-col gap-1 glass"
        >
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="p-3 rounded-xl hover:bg-blue-500/10"
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="p-3"
              >
                My dashboard
              </Link>

              <button
                type="button"
                className="p-3 text-left"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="p-3 text-left"
              onClick={() => {
                setAuthOpen(true);
                setOpen(false);
              }}
            >
              Client login
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
