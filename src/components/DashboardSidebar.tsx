"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import WalletTopUpModal from "@/components/WalletTopUpModal";

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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    fetch("/api/wallet")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setWalletBalance(d.balance); })
      .catch(() => {});
  }, []);

  // Keep a ref so the pathname effect doesn't re-run when onClose identity changes
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    onCloseRef.current();
  }, [pathname]);

  return (
    <>
      {/* Backdrop for mobile — must be a button so Safari fires touch events */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        className={`fixed inset-0 w-full h-full bg-black/60 z-40 transition-opacity duration-300 lg:hidden cursor-default ${
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
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="WAVR" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-lg font-black tracking-tighter text-white">
              WAV<span className="text-blue-500">R</span>
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-600 to-blue-400 shadow-md shadow-blue-600/20">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
              {roleBadge ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase bg-blue-900/30 text-blue-300 border-blue-700/30">
                  {roleBadge}
                </span>
              ) : (
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Wallet */}
        {walletBalance !== null && (
          <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              <span className="text-white text-xs font-bold">${walletBalance.toFixed(2)}</span>
              <span className="text-gray-600 text-[10px]">wallet</span>
            </div>
            <button onClick={() => setShowTopUp(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold border border-blue-700/40 px-2 py-0.5 rounded-md transition-colors">
              + Add
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const isActive = item.href ? pathname === item.href : activeTab === item.tab;

            const content = (
              <>
                <div className={`shrink-0 ${isActive ? "text-white" : "text-gray-500"}`}>
                  {typeof item.icon === "string" ? (
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
                      ? "bg-blue-600/20 text-blue-300 border border-blue-700/30 shadow-lg shadow-blue-900/20"
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
                onClick={() => { if (item.tab && onTabChange) onTabChange(item.tab); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600/20 text-blue-300 border border-blue-700/30 shadow-lg shadow-blue-900/20"
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-400 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      {showTopUp && (
        <WalletTopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={(bal) => { setWalletBalance(bal); setShowTopUp(false); }}
        />
      )}
    </>
  );
}
