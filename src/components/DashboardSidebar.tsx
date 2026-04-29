"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  tab?: string;
  href?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  roleBadge?: string;
}

export default function DashboardSidebar({
  items,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  title,
  roleBadge,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // Removed onClose from dependencies to prevent immediate closing on open

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              WAVR
            </span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{title}</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
              user?.role === 'admin' ? 'from-red-600 to-orange-600' : 'from-purple-600 to-fuchsia-600'
            }`}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
              {roleBadge ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                  user?.role === 'admin' 
                    ? 'bg-red-900/30 text-red-300 border-red-700/30' 
                    : 'bg-purple-900/30 text-purple-300 border-purple-700/30'
                }`}>
                  {roleBadge}
                </span>
              ) : (
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const isActive = item.href ? pathname === item.href : activeTab === item.tab;
            
            const content = (
              <>
                <div className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {typeof item.icon === 'string' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  ) : (
                    item.icon
                  )}
                </div>
                <span className="truncate">{item.label}</span>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-purple-600/20 text-purple-300 border border-purple-700/30 shadow-lg shadow-purple-900/20" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.tab && onTabChange) onTabChange(item.tab);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-purple-600/20 text-purple-300 border border-purple-700/30 shadow-lg shadow-purple-900/20" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {content}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Marketplace
          </Link>
          <button
            onClick={() => { logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
