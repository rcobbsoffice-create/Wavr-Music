"use client";

import { useAuth } from "@/context/AuthContext";

interface DashboardHeaderProps {
  title: string;
  onOpenSidebar: () => void;
  showSearch?: boolean;
}

export default function DashboardHeader({ title, onOpenSidebar, showSearch = false }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-gray-950/50 backdrop-blur-md border-b border-gray-800 h-16 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Toggle */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title */}
        <h1 className="text-lg sm:text-xl font-bold text-white capitalize truncate">
          {title}
        </h1>

        {/* Optional Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md ml-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-4">
        <div className="hidden sm:flex flex-col items-end mr-1 text-right">
          <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name}</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{user?.role}</p>
        </div>
        <div className={`w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${
          user?.role === 'admin' ? 'from-red-600 to-orange-600' : 'from-purple-600 to-fuchsia-600'
        }`}>
          {user?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
