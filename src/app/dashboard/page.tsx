"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function ProfileSettings() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ""); setBio(d.bio ?? ""); setEmail(d.email ?? ""); })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Failed to save"); return; }
      setMsg("Profile updated successfully.");
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-white">Profile Settings</h2>
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {msg && (
          <p className={`text-sm ${msg.includes("success") ? "text-green-400" : "text-red-400"}`}>{msg}</p>
        )}
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required maxLength={100}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Email</label>
          <input
            value={email}
            disabled
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
          />
          <p className="text-gray-600 text-xs mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Bio <span className="text-gray-600">({bio.length}/500)</span></label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tell fans about yourself..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

const navItems = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "music", label: "My Music", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
  { id: "beats", label: "Beat Sales", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
  { id: "merch", label: "Merch", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "payouts", label: "Payouts", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 16v-1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

interface ProducerStats {
  totalEarnings: number;
  beatsSold: number;
  activeLicenses: number;
  monthlyRevenue: number;
  recentSales: { id: string; beatTitle: string; buyerName: string; type: string; price: number; date: string }[];
  topBeats: { id: string; title: string; plays: number; revenue: number; licenses: number }[];
  monthlyEarnings: { month: string; revenue: number }[];
  payoutHistory: { id: string; amount: number; status: string; createdAt: string }[];
}

interface MyBeat {
  id: string;
  title: string;
  genre: string;
  plays: number;
  sales: number;
  revenue: number;
  status: string;
}

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [myBeats, setMyBeats] = useState<MyBeat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBeats, setLoadingBeats] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  const sidebarNavItems = navItems.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    tab: item.id
  }));

  useEffect(() => {
    fetch("/api/producer/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "music") return;
    setLoadingBeats(true);
    fetch("/api/beats/mine")
      .then((r) => r.json())
      .then((data) => setMyBeats(Array.isArray(data) ? data : []))
      .catch(() => setMyBeats([]))
      .finally(() => setLoadingBeats(false));
  }, [activeTab]);

  const maxMonthlyEarning = Math.max(...(stats?.monthlyEarnings.map((m) => m.revenue) ?? [1]), 1);

  async function handlePayoutRequest() {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) { setPayoutMsg("Enter a valid amount."); return; }
    setPayoutSubmitting(true);
    setPayoutMsg("");
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) { setPayoutMsg(data.error ?? "Request failed."); return; }
      setPayoutMsg("Payout request submitted! Processing within 3-5 business days.");
      setPayoutAmount("");
      // Refresh stats
      const s = await fetch("/api/producer/stats").then((r) => r.json());
      setStats(s);
    } catch {
      setPayoutMsg("Network error. Try again.");
    } finally {
      setPayoutSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row">
      {/* Shared Sidebar */}
      <DashboardSidebar
        items={sidebarNavItems}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Account"
        roleBadge="Artist"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <DashboardHeader
          title={navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Earnings",
                    value: loadingStats ? "—" : `$${(stats?.totalEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    sub: "all time",
                    color: "text-green-400",
                    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 16v-1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  },
                  {
                    label: "Monthly Revenue",
                    value: loadingStats ? "—" : `$${(stats?.monthlyRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    sub: "this month",
                    color: "text-blue-400",
                    icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
                  },
                  {
                    label: "Beat Sales",
                    value: loadingStats ? "—" : (stats?.beatsSold ?? 0).toString(),
                    sub: "licenses sold",
                    color: "text-purple-400",
                    icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                  },
                  {
                    label: "Active Licenses",
                    value: loadingStats ? "—" : (stats?.activeLicenses ?? 0).toString(),
                    sub: "in catalog",
                    color: "text-fuchsia-400",
                    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                      <svg className={`w-4 h-4 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                      </svg>
                    </div>
                    <p className="text-white text-2xl font-black">{card.value}</p>
                    <p className={`text-xs mt-1 font-medium ${card.color}`}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Monthly earnings chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold">Monthly Earnings</h3>
                  <span className="text-gray-500 text-xs">Last 12 months</span>
                </div>
                {loadingStats ? (
                  <div className="h-20 bg-gray-800 rounded animate-pulse" />
                ) : (
                  <>
                    <div className="flex items-end gap-1 h-20">
                      {(stats?.monthlyEarnings ?? []).map((m, i) => (
                        <div
                          key={i}
                          title={`${m.month}: $${m.revenue.toFixed(2)}`}
                          className="flex-1 bg-purple-600/40 hover:bg-purple-500/60 rounded-sm transition-colors"
                          style={{ height: `${(m.revenue / maxMonthlyEarning) * 100}%`, minHeight: m.revenue > 0 ? "4px" : "0" }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600 text-xs">{stats?.monthlyEarnings[0]?.month ?? ""}</span>
                      <span className="text-gray-600 text-xs">{stats?.monthlyEarnings[stats.monthlyEarnings.length - 1]?.month ?? ""}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-bold mb-4">Recent Sales</h3>
                  {loadingStats ? (
                    <div className="space-y-3">
                      {[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
                    </div>
                  ) : (stats?.recentSales ?? []).length === 0 ? (
                    <p className="text-gray-600 text-sm">No sales yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {(stats?.recentSales ?? []).slice(0, 6).map((sale) => (
                        <div key={sale.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-green-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-300 text-sm truncate">
                              <span className="font-medium">{sale.beatTitle}</span>
                              {" "}— {sale.type} license
                            </p>
                            <p className="text-gray-600 text-xs mt-0.5">
                              {sale.buyerName} · {new Date(sale.date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-green-400 text-sm font-semibold shrink-0">
                            ${sale.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Beats */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-bold mb-4">Top Performing Beats</h3>
                  {loadingStats ? (
                    <div className="space-y-3">
                      {[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
                    </div>
                  ) : (stats?.topBeats ?? []).length === 0 ? (
                    <p className="text-gray-600 text-sm">No beats yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(stats?.topBeats ?? []).map((beat, i) => (
                        <div key={beat.id} className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm w-4 shrink-0">{i + 1}</span>
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-800 to-fuchsia-900 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-300 text-sm truncate">{beat.title}</p>
                            <p className="text-gray-600 text-xs">
                              {beat.plays.toLocaleString()} plays · {beat.licenses} sales
                            </p>
                          </div>
                          <span className="text-green-400 text-sm font-semibold shrink-0">
                            ${beat.revenue.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "music" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">My Beats</h2>
                <Link href="/producer" className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                  + Upload Beat
                </Link>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Beat</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Genre</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Plays</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Sales</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium hidden md:table-cell">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loadingBeats ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-5 py-3">
                            <div className="h-8 bg-gray-800 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : myBeats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                          No beats uploaded yet.{" "}
                          <Link href="/producer" className="text-purple-400 hover:text-purple-300">Upload your first beat →</Link>
                        </td>
                      </tr>
                    ) : (
                      myBeats.map((beat) => (
                        <tr key={beat.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-800 to-fuchsia-900 shrink-0" />
                              <p className="text-gray-300 font-medium truncate max-w-[140px]">{beat.title}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{beat.genre}</td>
                          <td className="px-5 py-3 text-right text-gray-400">{beat.plays.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right text-gray-400 hidden sm:table-cell">{beat.sales}</td>
                          <td className="px-5 py-3 text-right text-green-400 font-semibold hidden md:table-cell">
                            ${beat.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Payouts</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Earned", value: loadingStats ? "—" : `$${(stats?.totalEarnings ?? 0).toFixed(2)}`, color: "from-green-900/30 to-gray-900 border-green-800/30" },
                  { label: "Monthly Revenue", value: loadingStats ? "—" : `$${(stats?.monthlyRevenue ?? 0).toFixed(2)}`, color: "from-yellow-900/20 to-gray-900 border-yellow-800/20" },
                  { label: "Total Paid Out", value: loadingStats ? "—" : `$${(stats?.payoutHistory ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0).toFixed(2)}`, color: "from-purple-900/30 to-gray-900 border-purple-800/30" },
                ].map((p) => (
                  <div key={p.label} className={`bg-gradient-to-br ${p.color} border rounded-xl p-5`}>
                    <p className="text-gray-500 text-xs mb-1">{p.label}</p>
                    <p className="text-white text-2xl font-black">{p.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Payout History</h3>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}
                  </div>
                ) : (stats?.payoutHistory ?? []).length === 0 ? (
                  <p className="text-gray-600 text-sm">No payouts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(stats?.payoutHistory ?? []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                        <div>
                          <p className="text-gray-300 text-sm">{new Date(p.createdAt).toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs">Bank Transfer</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">${p.amount.toFixed(2)}</p>
                          <span className={`text-xs ${p.status === "completed" ? "text-green-400" : "text-yellow-400"}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h3 className="text-white font-bold">Request Payout</h3>
                {payoutMsg && (
                  <p className={`text-sm ${payoutMsg.includes("submitted") ? "text-green-400" : "text-red-400"}`}>
                    {payoutMsg}
                  </p>
                )}
                <div className="flex gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="10"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Amount"
                      className="bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 w-36"
                    />
                  </div>
                  <button
                    onClick={handlePayoutRequest}
                    disabled={payoutSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                  >
                    {payoutSubmitting ? "Submitting…" : "Request Payout"}
                  </button>
                </div>
                <p className="text-gray-600 text-xs">Minimum $10 · Processed within 3-5 business days</p>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">Navigate to the full analytics page</p>
              <Link href="/analytics" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold px-6 py-3 rounded-xl">
                Open Analytics →
              </Link>
            </div>
          )}

          {(activeTab === "beats" || activeTab === "merch") && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500">This section is coming soon.</p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <ProfileSettings />
          )}
        </div>
      </div>
    </div>
  );
}
