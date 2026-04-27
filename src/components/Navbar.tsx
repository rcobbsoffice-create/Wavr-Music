"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDashboardPath } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";

const roleBadgeStyle: Record<string, string> = {
  admin: "bg-red-900/50 text-red-300 border border-red-700/30",
  producer: "bg-purple-900/50 text-purple-300 border border-purple-700/30",
  artist: "bg-cyan-900/50 text-cyan-300 border border-cyan-700/30",
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
                      pathname.startsWith("/analytics");

  if (isDashboard) return null;

  async function handleLogout() {
    await logout();
    router.push("/");
    setMobileOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Theme Selector */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-red-600">
                WAVR
              </span>
            </Link>

            <select 
              value={theme}
              onChange={(e) => changeTheme(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-300 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="default">Original</option>
              <option value="neon-blue">Neon Blue</option>
              <option value="crimson-nights">Crimson</option>
              <option value="cyber-yellow">Cyber</option>
            </select>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/marketplace"
              className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            >
              Marketplace
            </Link>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              href="/support/contact"
              className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              href="/news"
              className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            >
              News
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <div id="google_translate_element" className="mr-4" />
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
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md"
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
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md"
                >
                  Get Started
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
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3">
          <Link
            href="/marketplace"
            className="block text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider py-2"
            onClick={() => setMobileOpen(false)}
          >
            Marketplace
          </Link>
          <Link
            href="/about"
            className="block text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider py-2"
            onClick={() => setMobileOpen(false)}
          >
            About Us
          </Link>
          <Link
            href="/support/contact"
            className="block text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider py-2"
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>
          <Link
            href="/news"
            className="block text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider py-2"
            onClick={() => setMobileOpen(false)}
          >
            News
          </Link>
          <div className="pt-2 flex gap-3">
            {user ? (
              <>
                <Link
                  href={getDashboardPath(user.role)}
                  className="flex-1 text-center bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full"
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
                  className="flex-1 text-center bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full"
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
