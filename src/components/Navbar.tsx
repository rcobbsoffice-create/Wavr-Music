"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDashboardPath } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";

const roleBadgeStyle: Record<string, string> = {
  admin: "bg-blue-900/50 text-blue-300 border border-blue-700/30",
  producer: "bg-blue-900/50 text-blue-300 border border-blue-700/30",
  artist: "bg-sky-900/50 text-sky-300 border border-sky-700/30",
};

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const [theme, setTheme] = useState("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("site-theme") || "default";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("site-theme", newTheme);
  };

  // Hide navbar on dashboard pages
  const isDashboard = pathname.startsWith("/admin") ||
                      pathname.startsWith("/producer") ||
                      pathname.startsWith("/dashboard") ||
                      pathname.startsWith("/analytics") ||
                      pathname.startsWith("/artist");

  if (isDashboard) return null;

  async function handleLogout() {
    await logout();
    router.push("/");
    setMobileOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Theme Selector */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image src="/logo.png" alt="WAVR" width={36} height={36} className="w-9 h-9 object-contain" />
              <span className="text-xl font-black tracking-tighter text-white">
                WAV<span className="text-blue-500">R</span>
              </span>
            </Link>

            <select
              value={theme}
              onChange={(e) => changeTheme(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="default">Default</option>
              <option value="neon-blue">Neon Blue</option>
              <option value="crimson-nights">Crimson</option>
              <option value="cyber-yellow">Cyber</option>
            </select>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Home", href: "/" },
              { label: "Beats", href: "/marketplace" },
              { label: "Kits", href: "/kits" },
              { label: "Collections", href: "/collections" },
              { label: "About", href: "/about" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                  pathname === link.href ? "text-blue-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1">
              <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <div id="google_translate_element" />
            </div>
            {user ? (
              <>
                <NotificationBell />
                <Link
                  href={getDashboardPath(user.role)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 px-3 py-2"
                >
                  <span>{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleBadgeStyle[user.role] || ""}`}>
                    {user.role}
                  </span>
                </Link>
                <Link
                  href={getDashboardPath(user.role)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md shadow-blue-600/20"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200 px-3 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md shadow-blue-600/20"
                >
                  Start for Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-4 space-y-3">
          {[
            { label: "Home", href: "/" },
            { label: "Beats", href: "/marketplace" },
            { label: "Sound Kits", href: "/kits" },
            { label: "Collections", href: "/collections" },
            { label: "About Us", href: "/about" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {/* Translate — mobile */}
          <div className="flex items-center gap-2 py-2 border-t border-gray-800">
            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Language</span>
            <div id="google_translate_element_mobile" />
          </div>

          <div className="pt-2 flex gap-3">
            {user ? (
              <>
                <Link
                  href={getDashboardPath(user.role)}
                  className="flex-1 text-center bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center text-gray-300 border border-gray-700 text-sm font-medium px-4 py-2 rounded-full"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex-1 text-center text-gray-300 border border-gray-700 text-sm font-medium px-4 py-2 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {/* Spacer to push content down below the fixed navbar */}
      <div className="h-16" />
    </nav>
  );
}
