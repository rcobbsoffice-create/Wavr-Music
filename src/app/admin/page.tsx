"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Tab = "overview" | "users" | "moderation" | "revenue" | "support";

interface AdminStats {
  totalUsers: number;
  totalBeats: number;
  totalLicenses: number;
  totalRevenue: number;
  totalOrders: number;
  pendingPayouts: number;
  openTickets: number;
  monthlyRevenue: { month: string; revenue: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  recentLicenses: { id: string; beatTitle: string; buyerName: string; type: string; price: number; createdAt: string }[];
}

interface AdminUser {
  id: string; name: string; email: string; role: string; plan: string;
  suspended: boolean; verified: boolean; createdAt: string; revenue: number;
}

interface AdminBeat {
  id: string; title: string; producerName: string; genre: string;
  status: string; featured: boolean; plays: number; createdAt: string;
}

interface AdminPayout {
  id: string; userName: string; userEmail: string; amount: number;
  method: string; status: string; note: string | null; requestedAt: string;
}

interface AdminTicket {
  id: string; userName: string; userEmail: string; subject: string;
  message: string; status: string; priority: string; response: string | null; createdAt: string;
}

const sidebarItems: { tab: Tab; label: string; emoji: string }[] = [
  { tab: "overview",   label: "Overview",          emoji: "📊" },
  { tab: "users",      label: "User Management",   emoji: "👥" },
  { tab: "moderation", label: "Content Moderation",emoji: "🎵" },
  { tab: "revenue",    label: "Revenue & Payouts",  emoji: "💰" },
  { tab: "support",    label: "Support Tickets",    emoji: "🎫" },
];

const STATUS_COLORS: Record<string, string> = {
  open:        "text-yellow-400 bg-yellow-900/20 border-yellow-800/30",
  in_progress: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  resolved:    "text-green-400 bg-green-900/20 border-green-800/30",
  closed:      "text-gray-400 bg-gray-800 border-gray-700",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Overview
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Beats/Moderation
  const [beats, setBeats] = useState<AdminBeat[]>([]);
  const [loadingBeats, setLoadingBeats] = useState(false);

  // Payouts
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Support
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [respondId, setRespondId] = useState<string | null>(null);
  const [respondText, setRespondText] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [userSearch]);

  useEffect(() => { if (activeTab === "users") loadUsers(); }, [activeTab, loadUsers]);

  useEffect(() => {
    if (activeTab !== "moderation") return;
    setLoadingBeats(true);
    fetch("/api/admin/beats")
      .then((r) => r.json())
      .then((d) => setBeats(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingBeats(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "revenue") return;
    setLoadingPayouts(true);
    fetch("/api/admin/payouts")
      .then((r) => r.json())
      .then((d) => setPayouts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingPayouts(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "support") return;
    setLoadingTickets(true);
    fetch("/api/admin/support")
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  }, [activeTab]);

  async function toggleSuspend(u: AdminUser) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !u.suspended }),
    });
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, suspended: !x.suspended } : x));
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function toggleFeatured(beat: AdminBeat) {
    await fetch(`/api/admin/beats/${beat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !beat.featured }),
    });
    setBeats((prev) => prev.map((b) => b.id === beat.id ? { ...b, featured: !b.featured } : b));
  }

  async function setBeatStatus(id: string, status: string) {
    await fetch(`/api/admin/beats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBeats((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  }

  async function updatePayout(id: string, status: string) {
    await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  }

  async function submitResponse(id: string) {
    await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", response: respondText }),
    });
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: "resolved", response: respondText } : t));
    setRespondId(null); setRespondText("");
  }

  const maxMrr = Math.max(...(stats?.monthlyRevenue.map((m) => m.revenue) ?? [1]), 1);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 h-full z-40 overflow-y-auto`}>
        <div className="p-4 border-b border-gray-800 flex items-center gap-3 sticky top-0 bg-gray-900 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {sidebarOpen && <span className="text-white font-black text-xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">WAVR Admin</span>}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.name ?? "Admin"}</p>
                <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full border border-red-700/30">Administrator</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-0.5">
          {sidebarItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.tab
                  ? "bg-red-600/20 text-red-300 border border-red-700/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span className="shrink-0">{item.emoji}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 sticky bottom-0 bg-gray-900">
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-900/20 text-sm font-medium"
          >
            <span className="shrink-0">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300 p-6 min-h-screen`}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Platform Overview</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users",     value: loadingStats ? "…" : (stats?.totalUsers ?? 0).toLocaleString(),    color: "text-red-400" },
                { label: "Total Revenue",   value: loadingStats ? "…" : `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-yellow-400" },
                { label: "Licenses Sold",   value: loadingStats ? "…" : (stats?.totalLicenses ?? 0).toLocaleString(), color: "text-purple-400" },
                { label: "Beats Listed",    value: loadingStats ? "…" : (stats?.totalBeats ?? 0).toLocaleString(),    color: "text-blue-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 text-xs font-medium mb-2">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Merch Orders",    value: loadingStats ? "…" : (stats?.totalOrders ?? 0).toLocaleString(),   color: "text-fuchsia-400" },
                { label: "Pending Payouts", value: loadingStats ? "…" : (stats?.pendingPayouts ?? 0).toString(),      color: "text-orange-400" },
                { label: "Open Tickets",    value: loadingStats ? "…" : (stats?.openTickets ?? 0).toString(),         color: "text-red-400" },
                { label: "Status",          value: "Operational",                                                      color: "text-green-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-1">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* MRR Chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Monthly Revenue — Last 12 Months</h2>
                {loadingStats ? (
                  <div className="h-32 bg-gray-800 animate-pulse rounded" />
                ) : (
                  <>
                    <div className="flex items-end gap-1 h-28">
                      {(stats?.monthlyRevenue ?? []).map((m, i) => (
                        <div
                          key={i}
                          title={`${m.month}: $${m.revenue.toFixed(0)}`}
                          className="flex-1 bg-red-500/40 hover:bg-red-500/60 rounded-sm transition-colors"
                          style={{ height: `${(m.revenue / maxMrr) * 100}%`, minHeight: m.revenue > 0 ? "4px" : "0" }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600 text-xs">{stats?.monthlyRevenue[0]?.month}</span>
                      <span className="text-gray-600 text-xs">{stats?.monthlyRevenue[stats.monthlyRevenue.length - 1]?.month}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Recent activity */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Recent License Sales</h2>
                {loadingStats ? (
                  <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-8 bg-gray-800 animate-pulse rounded" />)}</div>
                ) : (stats?.recentLicenses ?? []).length === 0 ? (
                  <p className="text-gray-600 text-sm">No sales yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(stats?.recentLicenses ?? []).map((l) => (
                      <div key={l.id} className="flex items-center gap-3">
                        <span className="text-lg">💰</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs truncate">{l.beatTitle} — {l.type} license by {l.buyerName}</p>
                          <p className="text-gray-600 text-xs">{new Date(l.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-green-400 text-sm font-semibold shrink-0">${l.price.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">User Management</h1>
            <div className="flex gap-3">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                placeholder="Search by name or email…"
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 placeholder-gray-600 flex-1"
              />
              <button onClick={loadUsers} className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">Search</button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50">
                    <tr className="text-gray-400 text-xs">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Plan</th>
                      <th className="text-left px-5 py-3">Joined</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Revenue</th>
                      <th className="text-left px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loadingUsers ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-6 bg-gray-800 animate-pulse rounded" /></td></tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-600">No users found.</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white font-medium">{u.name}</p>
                                <p className="text-gray-500 text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                              u.role === "admin" ? "bg-red-900/40 text-red-300 border-red-700/30"
                              : "bg-purple-900/40 text-purple-300 border-purple-700/30"
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{u.plan}</td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.suspended ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>
                              {u.suspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-white font-medium">${u.revenue.toFixed(0)}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleSuspend(u)}
                                className="text-xs text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-700/30"
                              >
                                {u.suspended ? "Activate" : "Suspend"}
                              </button>
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="text-xs text-red-400 bg-red-900/20 hover:bg-red-900/40 px-2 py-1 rounded-lg border border-red-700/30"
                              >Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODERATION */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Content Moderation</h1>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h2 className="text-white font-bold">All Beats ({beats.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50">
                    <tr className="text-gray-400 text-xs">
                      <th className="text-left px-5 py-3">Beat</th>
                      <th className="text-left px-5 py-3">Producer</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Featured</th>
                      <th className="text-right px-5 py-3">Plays</th>
                      <th className="text-left px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loadingBeats ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-6 bg-gray-800 animate-pulse rounded" /></td></tr>
                      ))
                    ) : beats.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-600">No beats found.</td></tr>
                    ) : (
                      beats.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{b.title}</td>
                          <td className="px-5 py-3 text-gray-400 text-xs">{b.producerName}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              b.status === "active" ? "bg-green-900/30 text-green-400"
                              : b.status === "draft" ? "bg-gray-700 text-gray-400"
                              : "bg-yellow-900/30 text-yellow-400"
                            }`}>{b.status}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs ${b.featured ? "text-purple-400" : "text-gray-600"}`}>
                              {b.featured ? "⭐ Featured" : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-400">{b.plays.toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleFeatured(b)}
                                className={`text-xs px-2 py-1 rounded-lg border ${b.featured ? "text-gray-400 bg-gray-800 border-gray-700" : "text-purple-400 bg-purple-900/20 border-purple-700/30"}`}
                              >{b.featured ? "Unfeature" : "Feature"}</button>
                              {b.status === "active" ? (
                                <button onClick={() => setBeatStatus(b.id, "draft")} className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-1 rounded-lg">Unpublish</button>
                              ) : (
                                <button onClick={() => setBeatStatus(b.id, "active")} className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 px-2 py-1 rounded-lg">Publish</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE & PAYOUTS */}
        {activeTab === "revenue" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Revenue & Payouts</h1>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Total Revenue",   value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,    color: "text-green-400" },
                { label: "Pending Payouts", value: (stats?.pendingPayouts ?? 0).toString(),         color: "text-yellow-400" },
                { label: "Licenses Sold",   value: (stats?.totalLicenses ?? 0).toLocaleString(),   color: "text-purple-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold">Payout Requests</h2>
                {payouts.filter((p) => p.status === "pending").length > 0 && (
                  <span className="bg-amber-900/40 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-700/30">
                    {payouts.filter((p) => p.status === "pending").length} pending
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-800">
                {loadingPayouts ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-5"><div className="h-12 bg-gray-800 animate-pulse rounded" /></div>
                  ))
                ) : payouts.length === 0 ? (
                  <p className="text-gray-600 text-sm p-6">No payout requests yet.</p>
                ) : (
                  payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors">
                      <div>
                        <p className="text-white font-medium text-sm">{p.userName}</p>
                        <p className="text-gray-500 text-xs">{p.userEmail} · {p.method}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{new Date(p.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-white font-bold">${p.amount.toFixed(2)}</p>
                        {p.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updatePayout(p.id, "approved")}
                              className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 px-3 py-1.5 rounded-lg"
                            >Approve</button>
                            <button
                              onClick={() => updatePayout(p.id, "rejected")}
                              className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-3 py-1.5 rounded-lg"
                            >Reject</button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${
                            p.status === "approved" || p.status === "paid" ? "text-green-400 bg-green-900/20 border-green-700/30"
                            : "text-red-400 bg-red-900/20 border-red-700/30"
                          }`}>{p.status}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Support Tickets</h1>
            <div className="space-y-4">
              {loadingTickets ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                ))
              ) : tickets.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500">No support tickets.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-white font-semibold text-sm">{t.subject}</h3>
                        <p className="text-gray-500 text-xs">{t.userName} · {t.userEmail} · {new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full capitalize">{t.priority}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{t.message}</p>
                    {t.response && (
                      <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3 mb-3">
                        <p className="text-purple-300 text-xs font-semibold mb-1">Response sent</p>
                        <p className="text-gray-300 text-sm">{t.response}</p>
                      </div>
                    )}
                    {respondId === t.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={respondText}
                          onChange={(e) => setRespondText(e.target.value)}
                          rows={3}
                          placeholder="Type your response…"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitResponse(t.id)}
                            disabled={!respondText.trim()}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >Send & Resolve</button>
                          <button onClick={() => { setRespondId(null); setRespondText(""); }} className="text-gray-500 text-xs px-3 py-2">Cancel</button>
                        </div>
                      </div>
                    ) : t.status !== "resolved" && t.status !== "closed" ? (
                      <button
                        onClick={() => setRespondId(t.id)}
                        className="text-xs text-purple-400 bg-purple-900/20 border border-purple-700/30 px-3 py-1.5 rounded-lg"
                      >Respond</button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
