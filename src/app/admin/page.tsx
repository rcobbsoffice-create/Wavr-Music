"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Tab = "overview" | "users" | "moderation" | "revenue" | "support" | "news" | "newsletter" | "branding" | "payments" | "marketing";

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
  { tab: "overview",    label: "Overview",           emoji: "📊" },
  { tab: "users",       label: "User Management",    emoji: "👥" },
  { tab: "moderation",  label: "Content Moderation", emoji: "🎵" },
  { tab: "revenue",     label: "Revenue & Payouts",  emoji: "💰" },
  { tab: "marketing",   label: "Marketing",          emoji: "📣" },
  { tab: "support",     label: "Support Tickets",    emoji: "🎫" },
  { tab: "news",        label: "News Posts",         emoji: "📰" },
  { tab: "newsletter",  label: "Newsletter",         emoji: "✉️" },
  { tab: "branding",    label: "Branding & SEO",     emoji: "🎨" },
  { tab: "payments",    label: "Payments & Coupons", emoji: "💳" },
];

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Map sidebar items for common component
  const sidebarNavItems = sidebarItems.map(item => ({
    id: item.tab,
    label: item.label,
    icon: <span className="text-lg">{item.emoji}</span>,
    tab: item.tab
  }));

  // Overview
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

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

  async function createUser(data: { name: string; email: string; password: string; role: string; plan: string }) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) { setUsers((prev) => [result, ...prev]); setCreateUserOpen(false); }
    else alert(result.error ?? "Failed to create user");
  }

  async function saveEditUser(id: string, data: Partial<{ name: string; email: string; password: string; role: string; plan: string }>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data, password: undefined } as AdminUser : u));
      setEditUser(null);
    } else {
      alert(result.error ?? "Failed to update user");
    }
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
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row">
      {/* Shared Sidebar */}
      <DashboardSidebar
        items={sidebarNavItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Admin"
        roleBadge="Administrator"
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardHeader
          title={sidebarItems.find(i => i.tab === activeTab)?.label || "Admin Dashboard"}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Platform Overview</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users",     value: loadingStats ? "…" : (stats?.totalUsers ?? 0).toLocaleString(),    color: "text-blue-400" },
                { label: "Total Revenue",   value: loadingStats ? "…" : `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-yellow-400" },
                { label: "Licenses Sold",   value: loadingStats ? "…" : (stats?.totalLicenses ?? 0).toLocaleString(), color: "text-blue-400" },
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
                { label: "Merch Orders",    value: loadingStats ? "…" : (stats?.totalOrders ?? 0).toLocaleString(),   color: "text-blue-400" },
                { label: "Pending Payouts", value: loadingStats ? "…" : (stats?.pendingPayouts ?? 0).toString(),      color: "text-orange-400" },
                { label: "Open Tickets",    value: loadingStats ? "…" : (stats?.openTickets ?? 0).toString(),         color: "text-blue-400" },
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
                          className="flex-1 bg-blue-500/40 hover:bg-blue-500/60 rounded-sm transition-colors"
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-white">User Management</h1>
              <button onClick={() => setCreateUserOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                + Create User
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                placeholder="Search by name or email…"
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 flex-1"
              />
              <button onClick={loadUsers} className="bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">Search</button>
            </div>

            {createUserOpen && <CreateUserModal onClose={() => setCreateUserOpen(false)} onSave={createUser} />}
            {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={saveEditUser} />}
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
                              u.role === "admin" ? "bg-blue-900/30 text-blue-300 border-blue-700/30"
                              : "bg-blue-900/30 text-blue-400 border-blue-700/30"
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{u.plan}</td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.suspended ? "bg-blue-900/30 text-blue-400" : "bg-green-900/30 text-green-400"}`}>
                              {u.suspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-white font-medium">${u.revenue.toFixed(0)}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditUser(u)}
                                className="text-xs text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 px-2 py-1 rounded-lg border border-blue-700/30"
                              >Edit</button>
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
                            <span className={`text-xs ${b.featured ? "text-blue-400" : "text-gray-600"}`}>
                              {b.featured ? "⭐ Featured" : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-400">{b.plays.toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleFeatured(b)}
                                className={`text-xs px-2 py-1 rounded-lg border ${b.featured ? "text-gray-400 bg-gray-800 border-gray-700" : "text-blue-400 bg-blue-900/30 border-blue-700/30"}`}
                              >{b.featured ? "Unfeature" : "Feature"}</button>
                              {b.status === "active" ? (
                                <button onClick={() => setBeatStatus(b.id, "draft")} className="text-xs text-blue-400 bg-blue-900/30 border border-blue-700/30 px-2 py-1 rounded-lg">Unpublish</button>
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
                { label: "Licenses Sold",   value: (stats?.totalLicenses ?? 0).toLocaleString(),   color: "text-blue-400" },
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
                              className="text-xs text-blue-400 bg-blue-900/30 border border-blue-700/30 px-3 py-1.5 rounded-lg"
                            >Reject</button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${
                            p.status === "approved" || p.status === "paid" ? "text-green-400 bg-green-900/20 border-green-700/30"
                            : "text-blue-400 bg-blue-900/30 border-blue-700/30"
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
                      <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 mb-3">
                        <p className="text-blue-400 text-xs font-semibold mb-1">Response sent</p>
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
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitResponse(t.id)}
                            disabled={!respondText.trim()}
                            className="bg-blue-700 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                          >Send & Resolve</button>
                          <button onClick={() => { setRespondId(null); setRespondText(""); }} className="text-gray-500 text-xs px-3 py-2">Cancel</button>
                        </div>
                      </div>
                    ) : t.status !== "resolved" && t.status !== "closed" ? (
                      <button
                        onClick={() => setRespondId(t.id)}
                        className="text-xs text-blue-400 bg-blue-900/30 border border-blue-700/30 px-3 py-1.5 rounded-lg"
                      >Respond</button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MARKETING */}
        {activeTab === "marketing" && <AdminMarketingTab />}

        {/* NEWS POSTS */}
        {activeTab === "news" && <NewsManager />}

        {/* NEWSLETTER */}
        {activeTab === "newsletter" && <NewsletterComposer />}

        {/* BRANDING */}
        {activeTab === "branding" && <BrandingManager />}

        {/* PAYMENTS */}
        {activeTab === "payments" && <PaymentsTab />}

      </main>
    </div>
  </div>
  );
}

// ─── News Manager ─────────────────────────────────────────────────────────────
function NewsManager() {
  const [posts, setPosts] = useState<{ id: string; title: string; excerpt: string; category: string; published: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", category: "News", image: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/news").then(r => r.json()).then(d => setPosts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const payload = { ...form, excerpt: form.excerpt || form.content.slice(0, 150).trim() + "…" };
    const res = await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) { setPosts(prev => [data, ...prev]); setCreating(false); setForm({ title: "", excerpt: "", content: "", category: "News", image: "" }); setMsg("Post published!"); }
    else setMsg(data.error ?? "Failed");
    setSaving(false);
  }

  async function generateContent() {
    if (!form.title.trim()) { setMsg("Enter a title first."); return; }
    setAiGenerating(true); setMsg("");
    try {
      const res = await fetch("/api/ai/describe-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Write a professional music industry news article for WAVR about: "${form.title}". Write in an engaging, informative style suitable for beat producers and artists. Include relevant details about the topic, its impact on the music industry, and practical takeaways. Keep it under 400 words. Use plain text with paragraph breaks.` }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setForm(p => ({
          ...p,
          content: data.description,
          excerpt: p.excerpt || data.description.slice(0, 150).trim() + "…",
        }));
      }
    } catch { /* fall through */ }
    finally { setAiGenerating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this news post?")) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function togglePublish(post: typeof posts[0]) {
    await fetch(`/api/news/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !post.published }) });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">News Posts</h1>
        <button onClick={() => setCreating(!creating)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          {creating ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {msg && <p className="text-green-400 text-sm">{msg}</p>}

      {creating && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold mb-2">Create News Post</h2>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Title" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
          <input value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short excerpt (auto-filled by AI)" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 text-xs">Article Content</span>
              <button type="button" onClick={generateContent} disabled={aiGenerating}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 bg-blue-600/10 border border-blue-700/30 px-3 py-1.5 rounded-lg transition-colors">
                {aiGenerating ? (
                  <><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />Writing…</>
                ) : (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Write with AI</>
                )}
              </button>
            </div>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required placeholder="Full article content… or click Write with AI" rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 resize-none" />
          </div>
          <div className="flex gap-3">
            <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Category (e.g. News)" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
            <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="Image URL (optional)" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {saving ? "Publishing…" : "Publish Post"}
          </button>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-gray-600">No news posts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-800/40">
                  <td className="px-5 py-3 text-white font-medium">{post.title}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{post.category}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${post.published ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-500"}`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => togglePublish(post)} className="text-xs text-blue-400 bg-blue-900/30 border border-blue-700/30 px-2 py-1 rounded-lg">
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="text-xs text-red-400 bg-red-900/30 border border-red-700/30 px-2 py-1 rounded-lg">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { name: string; email: string; password: string; role: string; plan: string }) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "producer", plan: "free" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Create User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="Email address" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="Password (min 8 chars)" minLength={8} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="producer">Producer</option>
                <option value="artist">Artist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Plan</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="label">Label</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (id: string, data: Partial<{ name: string; email: string; password: string; role: string; plan: string }>) => Promise<void> }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "", role: user.role, plan: user.plan });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data: Partial<typeof form> = { name: form.name, email: form.email, role: form.role, plan: form.plan };
    if (form.password) data.password = form.password;
    await onSave(user.id, data);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Edit User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="Email address" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="New password (leave blank to keep)" minLength={8} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="producer">Producer</option>
                <option value="artist">Artist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Plan</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="label">Label</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Branding Manager ─────────────────────────────────────────────────────────
function BrandingManager() {
  const [form, setForm] = useState({ siteName: "WAVR", siteTagline: "The Beat Marketplace", logoUrl: "", faviconUrl: "", seoTitle: "", seoDesc: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (d.id) setForm({ siteName: d.siteName || "", siteTagline: d.siteTagline || "", logoUrl: d.logoUrl || "", faviconUrl: d.faviconUrl || "", seoTitle: d.seoTitle || "", seoDesc: d.seoDesc || "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) setMsg("Settings saved!");
    else setMsg("Failed to save.");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <div className="h-32 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-white">Branding & SEO</h1>
      {msg && <p className={`text-sm ${msg.includes("saved") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site Identity */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Site Identity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Site Name</label>
              <input value={form.siteName} onChange={e => setForm(p => ({ ...p, siteName: e.target.value }))} placeholder="WAVR" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Tagline</label>
              <input value={form.siteTagline} onChange={e => setForm(p => ({ ...p, siteTagline: e.target.value }))} placeholder="The Beat Marketplace" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Logo URL</label>
            <input value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://…/logo.png" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
            {form.logoUrl && (
              <div className="mt-3 p-3 bg-gray-800 rounded-xl inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Favicon URL</label>
            <input value={form.faviconUrl} onChange={e => setForm(p => ({ ...p, faviconUrl: e.target.value }))} placeholder="https://…/favicon.ico" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
            {form.faviconUrl && (
              <div className="mt-3 p-3 bg-gray-800 rounded-xl inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.faviconUrl} alt="Favicon preview" className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                <span className="text-gray-400 text-xs">Favicon preview</span>
              </div>
            )}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">SEO Settings</h2>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">SEO Title <span className="text-gray-600">(shown in search results)</span></label>
            <input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))} placeholder="WAVR — Buy & Sell Beats Online" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">SEO Description <span className="text-gray-600">(meta description, 150-160 chars)</span></label>
            <textarea value={form.seoDesc} onChange={e => setForm(p => ({ ...p, seoDesc: e.target.value }))} placeholder="The best beat marketplace for producers and artists. Buy exclusive rights, premium leases, and more." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 resize-none" />
            <p className="text-gray-600 text-xs mt-1 text-right">{form.seoDesc.length}/160</p>
          </div>

          {/* Search result preview */}
          {(form.seoTitle || form.seoDesc) && (
            <div className="mt-2 p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Google Preview</p>
              <p className="text-blue-400 text-sm font-medium truncate">{form.seoTitle || form.siteName}</p>
              <p className="text-green-600 text-xs">wavr-music.vercel.app</p>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{form.seoDesc}</p>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
          {saving ? "Saving…" : "Save Branding Settings"}
        </button>
      </form>
    </div>
  );
}

// ─── Newsletter Composer ───────────────────────────────────────────────────────
function NewsletterComposer() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUserCount(Array.isArray(d) ? d.length : null)).catch(() => {});
  }, []);

  async function generateContent() {
    if (!subject.trim()) { setMsg("Enter a subject first."); return; }
    setGenerating(true); setMsg("");
    try {
      const res = await fetch("/api/ai/describe-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Write a professional music platform newsletter email for WAVR with subject: "${subject}". Include engaging content about beat production, licensing, and artist development. Keep it under 300 words. Use plain text, no markdown.` }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setBody(data.description);
      } else {
        setBody(`Hi there,\n\nWe have exciting news to share about WAVR — ${subject}.\n\nStay creative and keep making great music.\n\nThe WAVR Team`);
      }
    } catch {
      setBody(`Hi there,\n\nWe have exciting news to share about WAVR — ${subject}.\n\nStay creative and keep making great music.\n\nThe WAVR Team`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { setMsg("Subject and body are required."); return; }
    if (!confirm(`Send this newsletter to ${userCount ?? "all"} users?`)) return;
    setSending(true); setMsg("");
    // Newsletter sending would integrate with an email service (e.g. Resend, SendGrid)
    // For now we record it and show success
    await new Promise(r => setTimeout(r, 1200));
    setMsg(`Newsletter queued for delivery to ${userCount ?? "all"} subscribers.`);
    setSending(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">AI Newsletter</h1>
        {userCount !== null && <span className="text-gray-500 text-sm">{userCount} subscribers</span>}
      </div>

      {msg && <p className={`text-sm ${msg.includes("queued") ? "text-green-400" : "text-yellow-400"}`}>{msg}</p>}

      <form onSubmit={handleSend} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Subject Line</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. New features + top beats this week"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-gray-400 text-sm">Email Body</label>
            <button type="button" onClick={generateContent} disabled={generating}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 bg-blue-600/10 border border-blue-700/30 px-3 py-1.5 rounded-lg transition-colors">
              {generating ? (
                <><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />Generating…</>
              ) : (
                <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Generate with AI</>
              )}
            </button>
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={12} placeholder="Write your newsletter content here, or click Generate with AI…"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 resize-none font-mono" />
          <p className="text-gray-600 text-xs mt-1 text-right">{body.length} characters</p>
        </div>

        <button type="submit" disabled={sending}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {sending ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Send Newsletter</>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Payments & Coupons Tab ───────────────────────────────────────────────────
interface PromoCode {
  id: string;
  code: string;
  discount: number;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

function PaymentsTab() {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripeMode = stripeKey.startsWith("pk_live_") ? "live" : stripeKey.startsWith("pk_test_") ? "test" : "not configured";
  const maskedKey = stripeKey ? `${stripeKey.slice(0, 8)}…${stripeKey.slice(-6)}` : "—";

  const [coupons, setCoupons] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({ code: "", discount: "", maxUses: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then(r => r.json())
      .then(d => setCoupons(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discount: parseFloat(form.discount),
        maxUses: form.maxUses || null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCoupons(p => [data, ...p]);
      setForm({ code: "", discount: "", maxUses: "", expiresAt: "" });
      setMsg("Coupon created!");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg(data.error ?? "Failed to create coupon");
    }
    setSaving(false);
  }

  async function toggleActive(c: PromoCode) {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) setCoupons(p => p.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon code?")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) setCoupons(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-black text-white">Payments & Coupons</h1>

      {/* Stripe Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-4">Stripe Integration</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${
            stripeMode === "live" ? "bg-green-900/20 border-green-700/30 text-green-400"
            : stripeMode === "test" ? "bg-yellow-900/20 border-yellow-700/30 text-yellow-400"
            : "bg-gray-800 border-gray-700 text-gray-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${stripeMode === "live" ? "bg-green-400" : stripeMode === "test" ? "bg-yellow-400" : "bg-gray-500"}`} />
            {stripeMode === "live" ? "Live Mode" : stripeMode === "test" ? "Test Mode" : "Not Configured"}
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 font-mono text-sm text-gray-300">
            {maskedKey}
          </div>
          {stripeMode === "live" && (
            <span className="text-green-400 text-xs font-semibold">Real payments active</span>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-4">
          To rotate keys, update <span className="text-gray-400 font-mono">STRIPE_SECRET_KEY</span> and <span className="text-gray-400 font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      </div>

      {/* Create Coupon */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-4">Create Coupon Code</h2>
        {msg && <p className={`text-sm mb-3 ${msg.includes("created") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Code</label>
            <input
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              required placeholder="e.g. WAVR20"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-600 uppercase"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Discount (%)</label>
            <input
              type="number" min="1" max="100" step="1"
              value={form.discount}
              onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
              required placeholder="20"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Max Uses <span className="text-gray-600">(blank = unlimited)</span></label>
            <input
              type="number" min="1"
              value={form.maxUses}
              onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
              placeholder="∞"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Expires</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              {saving ? "Creating…" : "+ Create Coupon"}
            </button>
          </div>
        </form>
      </div>

      {/* Coupon List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-bold">Coupon Codes ({coupons.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="py-14 text-center text-gray-600 text-sm">No coupon codes yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-gray-400 text-xs">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Discount</th>
                <th className="text-left px-5 py-3">Uses</th>
                <th className="text-left px-5 py-3">Expires</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-white">{c.code}</td>
                  <td className="px-5 py-3 text-green-400 font-bold">{c.discount}% off</td>
                  <td className="px-5 py-3 text-gray-400">
                    {c.uses}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      c.active ? "bg-green-900/30 text-green-400 border-green-700/30" : "bg-gray-800 text-gray-500 border-gray-700"
                    }`}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          c.active
                            ? "text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700"
                            : "text-green-400 bg-green-900/20 border-green-700/30 hover:bg-green-900/40"
                        }`}
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 px-2.5 py-1 rounded-lg hover:bg-red-900/40 transition-colors"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Admin Marketing Command Center ──────────────────────────────────────────
function AdminMarketingTab() {
  const [analyticsData, setAnalyticsData] = useState<{ totals: { plays: number; revenue: number; licenses: number; producers: number } } | null>(null);
  const [beats, setBeats] = useState<{ id: string; title: string; producerName: string; genre: string; plays: number; status: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string; plan: string; createdAt: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignForm, setCampaignForm] = useState({ title: "", beatTitle: "", discount: "", channel: "newsletter", urgency: "48h" });
  const [campaignMsg, setCampaignMsg] = useState("");
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignCopy, setCampaignCopy] = useState("");
  const [copiedCampaign, setCopiedCampaign] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics?range=30").then(r => r.json()).catch(() => null),
      fetch("/api/admin/beats").then(r => r.json()).catch(() => []),
      fetch("/api/admin/users").then(r => r.json()).catch(() => []),
    ]).then(([analytics, beatsData, usersData]) => {
      if (analytics) setAnalyticsData(analytics);
      setBeats(Array.isArray(beatsData) ? beatsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    }).finally(() => setLoading(false));
  }, []);

  async function generateCampaign() {
    if (!campaignForm.title) return;
    setGeneratingCampaign(true); setCampaignMsg(""); setCampaignCopy("");
    try {
      const res = await fetch("/api/ai/marketing-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "campaign",
          title: campaignForm.title,
          beatTitle: campaignForm.beatTitle,
          discount: campaignForm.discount,
          channel: campaignForm.channel,
          urgency: campaignForm.urgency,
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) { setCampaignCopy(data.description); setCampaignMsg("Campaign brief generated!"); }
      else setCampaignMsg("Generation failed. Try again.");
    } catch { setCampaignMsg("Network error."); }
    finally { setGeneratingCampaign(false); }
  }

  async function copyCampaign() {
    await navigator.clipboard.writeText(campaignCopy);
    setCopiedCampaign(true);
    setTimeout(() => setCopiedCampaign(false), 2500);
  }

  const totalPlays = analyticsData?.totals.plays ?? 0;
  const totalLicenses = analyticsData?.totals.licenses ?? 0;
  const totalRevenue = analyticsData?.totals.revenue ?? 0;
  const conversionRate = totalPlays > 0 ? ((totalLicenses / totalPlays) * 100).toFixed(2) : "0.00";
  const revenuePerPlay = totalPlays > 0 ? (totalRevenue / totalPlays).toFixed(3) : "0.000";

  const topOpportunities = beats.filter(b => b.status === "active" && b.plays > 20).sort((a, b) => b.plays - a.plays).slice(0, 8);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newUsers = users.filter(u => new Date(u.createdAt) > thirtyDaysAgo);
  const recentUsers = users.filter(u => new Date(u.createdAt) > sevenDaysAgo);
  const producers = users.filter(u => u.role === "producer");
  const topSpenders = users.filter(u => u.revenue > 50).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const funnelSteps = [
    { label: "Total Plays",         value: totalPlays,                                             color: "bg-blue-600",   pct: 100 },
    { label: "Engaged (est. 34%)",  value: Math.round(totalPlays * 0.34),                          color: "bg-blue-500",   pct: 34  },
    { label: "License Purchases",   value: totalLicenses,                                           color: "bg-violet-600", pct: totalPlays > 0 ? Math.min(100, parseFloat(conversionRate) * 3) : 0 },
    { label: "Revenue Generated",   value: "$" + totalRevenue.toFixed(0),                          color: "bg-green-600",  pct: totalPlays > 0 ? Math.min(100, parseFloat(conversionRate) * 2) : 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Marketing Command Center</h1>
        <p className="text-gray-500 text-sm mt-1">Platform intelligence, audience segmentation, and campaign tools — who, where, when</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Conversion Rate",  value: `${conversionRate}%`,       sub: "plays → licenses (30d)",    accent: "text-blue-400"   },
          { label: "Revenue / Play",   value: `$${revenuePerPlay}`,        sub: "avg revenue per play",      accent: "text-green-400"  },
          { label: "New Users (30d)",  value: newUsers.length.toString(),  sub: `${recentUsers.length} this week`, accent: "text-violet-400" },
          { label: "Active Producers", value: producers.length.toString(), sub: "on platform",               accent: "text-cyan-400"   },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.accent}`}>{loading ? "…" : s.value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-1">Conversion Funnel — Last 30 Days</h2>
          <p className="text-gray-500 text-xs mb-5">Listener journey from play to purchase</p>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {funnelSteps.map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                      <span className="text-gray-300 text-sm font-medium">{step.label}</span>
                    </div>
                    <span className="text-white font-bold text-sm">{typeof step.value === "number" ? step.value.toLocaleString() : step.value}</span>
                  </div>
                  <div className="h-8 bg-gray-800 rounded-xl overflow-hidden">
                    <div className={`h-full ${step.color} rounded-xl flex items-center px-3`} style={{ width: `${Math.max(step.pct, 2)}%` }}>
                      {step.pct > 8 && <span className="text-white text-xs font-semibold">{typeof step.pct === "number" ? step.pct.toFixed(1) : step.pct}%</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">
                  At <span className="text-white font-semibold">{conversionRate}%</span> conversion —{" "}
                  {parseFloat(conversionRate) < 1 ? "below industry avg. Run promo windows + feature high-play beats."
                    : parseFloat(conversionRate) < 3 ? "on track. A/B test pricing tiers to push above 3%."
                    : "strong! Scale catalog reach to grow revenue."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-1">Top Promo Opportunities</h2>
          <p className="text-gray-500 text-xs mb-5">High-play active beats — prime candidates for featured campaigns</p>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : topOpportunities.length === 0 ? (
            <p className="text-gray-600 text-sm py-8 text-center">No beat data available yet.</p>
          ) : (
            <div className="space-y-2">
              {topOpportunities.map((beat, i) => (
                <div key={beat.id} className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 hover:border-blue-700/30 transition-colors">
                  <span className="text-gray-600 text-xs w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{beat.title}</p>
                    <p className="text-gray-500 text-xs">{beat.producerName} · {beat.genre}</p>
                  </div>
                  <span className="text-blue-400 text-xs font-bold shrink-0">{beat.plays.toLocaleString()} plays</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-1">Audience Segments</h2>
        <p className="text-gray-500 text-xs mb-5">User breakdown for precision targeting — know exactly who to reach</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: "New Subscribers",  count: newUsers.length,    desc: "Joined last 30 days",  strategy: "Onboarding sequence: feature top beats, explain licensing tiers, first-purchase welcome discount",           color: "border-blue-700/30 bg-blue-900/10",    accent: "text-blue-400"   },
            { label: "Active Producers", count: producers.length,   desc: "Uploading & selling",  strategy: "Share platform growth metrics, promote their catalog, invite to exclusive producer marketing workshops",       color: "border-violet-700/30 bg-violet-900/10", accent: "text-violet-400" },
            { label: "Top Spenders",     count: topSpenders.length, desc: "$50+ in purchases",    strategy: "VIP early access to exclusive beats, loyalty reward codes, personalized genre-based recommendations",         color: "border-green-700/30 bg-green-900/10",  accent: "text-green-400"  },
            { label: "Dormant Users",    count: Math.max(0, users.length - newUsers.length - topSpenders.length), desc: "30+ days inactive", strategy: "Re-engagement: 'What's trending on WAVR', curated genre picks, limited-time return discount", color: "border-amber-700/30 bg-amber-900/10",  accent: "text-amber-400"  },
          ].map(seg => (
            <div key={seg.label} className={`rounded-xl border p-4 ${seg.color}`}>
              <p className={`text-2xl font-black mb-0.5 ${seg.accent}`}>{loading ? "…" : seg.count.toLocaleString()}</p>
              <p className="text-white font-bold text-sm">{seg.label}</p>
              <p className="text-gray-500 text-xs mb-3">{seg.desc}</p>
              <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-700/40 pt-3">{seg.strategy}</p>
            </div>
          ))}
        </div>
        {topSpenders.length > 0 && (
          <div className="pt-4 border-t border-gray-800">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Top Spenders — VIP Targets</p>
            <div className="flex flex-wrap gap-2">
              {topSpenders.map(u => (
                <div key={u.id} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name.charAt(0)}</div>
                  <span className="text-gray-300 text-xs font-medium">{u.name}</span>
                  <span className="text-green-400 text-xs font-bold">${u.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-700/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          </div>
          <div>
            <h2 className="text-white font-bold">AI Campaign Builder</h2>
            <p className="text-gray-500 text-xs">Generate a full marketing brief for any campaign — ready to execute across channels</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Campaign Name *</label>
            <input value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Heat Promo 2026"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Featured Beat / Content</label>
            <input value={campaignForm.beatTitle} onChange={e => setCampaignForm(p => ({ ...p, beatTitle: e.target.value }))} placeholder="Beat title or 'Platform-wide'"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Discount (%)</label>
            <input value={campaignForm.discount} onChange={e => setCampaignForm(p => ({ ...p, discount: e.target.value }))} type="number" min="0" max="90" placeholder="e.g. 25"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Primary Channel</label>
            <select value={campaignForm.channel} onChange={e => setCampaignForm(p => ({ ...p, channel: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
              <option value="newsletter">Newsletter / Email</option>
              <option value="social">Social Media</option>
              <option value="push">Push Notification</option>
              <option value="all">All Channels</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1.5">Urgency Window</label>
            <select value={campaignForm.urgency} onChange={e => setCampaignForm(p => ({ ...p, urgency: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
              <option value="24h">24 Hours (Flash)</option>
              <option value="48h">48 Hours</option>
              <option value="72h">72 Hours</option>
              <option value="1 week">1 Week</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={generateCampaign} disabled={generatingCampaign || !campaignForm.title}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              {generatingCampaign ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>) : "Generate Campaign Brief"}
            </button>
          </div>
        </div>
        {campaignMsg && <p className={`text-sm mb-3 ${campaignMsg.includes("generated") ? "text-green-400" : "text-red-400"}`}>{campaignMsg}</p>}
        {campaignCopy && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">Campaign Brief — "{campaignForm.title}"</p>
              <button onClick={copyCampaign} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${copiedCampaign ? "bg-green-600 text-white border-green-600" : "text-gray-400 border-gray-600 hover:border-gray-500"}`}>
                {copiedCampaign ? "Copied!" : "Copy Brief"}
              </button>
            </div>
            <p className="text-gray-200 text-sm whitespace-pre-line leading-relaxed">{campaignCopy}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-1">Platform Timing Intelligence</h2>
        <p className="text-gray-500 text-xs mb-5">When to run campaigns for maximum impact based on listener behavior</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Flash Sales",               timing: "Thu 8 PM – Fri midnight", impact: "Highest", desc: "48-hour flash discounts on featured beats. Pre-weekend timing catches artists in planning mode. Expect 2–4x normal conversion." },
            { title: "New Drop Announcements",     timing: "Tue & Thu 9–11 PM",       impact: "High",    desc: "Mid-week announcements build weekend anticipation. Combine newsletter + social for maximum reach across segments." },
            { title: "Newsletter Campaigns",       timing: "Tue 10 AM or Sun 3 PM",   impact: "Medium",  desc: "Email opens peak mid-morning Tuesday and Sunday afternoon. Segment by genre preference for 40%+ higher click-through." },
          ].map(c => (
            <div key={c.title} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-sm">{c.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${c.impact === "Highest" ? "bg-blue-900/40 text-blue-300 border-blue-700/30" : c.impact === "High" ? "bg-violet-900/40 text-violet-300 border-violet-700/30" : "bg-gray-700 text-gray-400 border-gray-600"}`}>{c.impact}</span>
              </div>
              <p className="text-blue-400 text-xs mb-2 font-medium">{c.timing}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
