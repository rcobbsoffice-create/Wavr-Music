"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface MyBeat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  priceBasic: number;
  plays: number;
  sales: number;
  revenue: number;
  status: string;
  featured: boolean;
  audioFile?: string | null;
  createdAt: string;
}

type Tab = "overview" | "beats" | "earnings" | "analytics" | "licensing" | "payouts" | "settings";

interface ProducerStats {
  stats: { totalEarnings: number; beatsSold: number; activeLicenses: number; monthlyRevenue: number };
  recentSales: { beat: string; buyer: string; license: string; amount: number; date: string }[];
  topBeats: { name: string; revenue: number; sales: number }[];
  monthlyEarnings: number[];
  earningsByType: { basic: number; premium: number; exclusive: number };
  licenseAgreements: { beat: string; buyer: string; type: string; date: string; status: string }[];
  payoutHistory: { date: string; amount: number; method: string; status: string }[];
}

function PayoutsTab({ producerStats }: { producerStats: ProducerStats | null }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const totalPaid = (producerStats?.payoutHistory ?? [])
    .filter((p) => p.status.toLowerCase() === "paid" || p.status.toLowerCase() === "completed")
    .reduce((s, p) => s + p.amount, 0);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { setMsg("Enter a valid amount."); return; }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Request failed."); return; }
      setMsg("Payout request submitted! Processing within 3–5 business days.");
      setAmount("");
    } catch { setMsg("Network error. Try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Payouts</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Total Earnings</p>
          <p className="text-3xl font-black text-green-400">${(producerStats?.stats.totalEarnings ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Monthly Revenue</p>
          <p className="text-3xl font-black text-amber-400">${(producerStats?.stats.monthlyRevenue ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Total Paid Out</p>
          <p className="text-3xl font-black text-purple-400">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Request payout */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-3">Request Payout</h2>
        {msg && <p className={`text-sm mb-3 ${msg.includes("submitted") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <form onSubmit={handleRequest} className="flex gap-3 items-end">
          <div>
            <label className="text-gray-500 text-xs block mb-1.5">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number" min="10" step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 w-36"
              />
            </div>
          </div>
          <button
            type="submit" disabled={submitting}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >{submitting ? "Submitting…" : "Request Payout"}</button>
        </form>
        <p className="text-gray-600 text-xs mt-2">Minimum $10 · Processed within 3–5 business days</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-4">Payout History</h2>
        {(producerStats?.payoutHistory ?? []).length === 0 ? (
          <p className="text-gray-600 text-sm">No payouts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left pb-3">Date</th>
                <th className="text-left pb-3">Amount</th>
                <th className="text-left pb-3">Method</th>
                <th className="text-left pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(producerStats?.payoutHistory ?? []).map((p, i) => (
                <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 text-gray-300">{p.date}</td>
                  <td className="py-3 text-white font-bold">${p.amount.toFixed(2)}</td>
                  <td className="py-3 text-gray-400">{p.method}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status.toLowerCase() === "paid" || p.status.toLowerCase() === "approved"
                        ? "bg-green-900/30 text-green-400"
                        : p.status.toLowerCase() === "pending"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-red-900/30 text-red-400"
                    }`}>{p.status}</span>
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

function ProducerSettings({ userName, userEmail, userPlan }: { userName?: string; userEmail?: string; userPlan?: string }) {
  const [name, setName] = useState(userName ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ""); setBio(d.bio ?? ""); })
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
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Profile Settings</h2>
          {msg && <p className={`text-sm ${msg.includes("success") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Display Name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              required maxLength={100}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Email</label>
            <input
              value={userEmail ?? ""} disabled
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Bio <span className="text-gray-600">({bio.length}/500)</span></label>
            <textarea
              value={bio} onChange={(e) => setBio(e.target.value)}
              maxLength={500} rows={4}
              placeholder="Tell fans about yourself…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >{saving ? "Saving…" : "Save Changes"}</button>
        </form>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4">Current Plan</h2>
          <div className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/20 border border-purple-700/30 rounded-xl p-4 mb-4">
            <p className="text-purple-300 font-bold text-lg capitalize">{userPlan ?? "Free"} Plan</p>
            {["Unlimited beat uploads", "Priority marketplace placement", "Advanced analytics", "95% royalty rate"].map((f) => (
              <li key={f} className="text-gray-400 text-xs flex items-center gap-2 mt-2 list-none">
                <svg className="w-3 h-3 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </li>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Producer stats (overview / earnings / licensing / payouts)
  const [producerStats, setProducerStats] = useState<ProducerStats | null>(null);

  useEffect(() => {
    fetch("/api/producer/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setProducerStats(data); })
      .catch(() => {});
  }, []);

  // My Beats state
  const [myBeatsData, setMyBeatsData] = useState<MyBeat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadBpm, setUploadBpm] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [uploadMood, setUploadMood] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadPriceBasic, setUploadPriceBasic] = useState("29.99");
  const [uploadPricePremium, setUploadPricePremium] = useState("99.99");
  const [uploadPriceExclusive, setUploadPriceExclusive] = useState("299.99");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [collabs, setCollabs] = useState<{ email: string; split: string; role: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "beats" || activeTab === "analytics") {
      fetchMyBeats();
    }
  }, [activeTab]);

  async function fetchMyBeats() {
    setBeatsLoading(true);
    try {
      const res = await fetch("/api/beats/mine");
      if (res.ok) setMyBeatsData(await res.json());
    } finally {
      setBeatsLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    if (!uploadTitle || !uploadGenre || !uploadBpm || !uploadKey) {
      setUploadError("Title, genre, BPM, and key are required.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", uploadTitle);
      fd.append("genre", uploadGenre);
      fd.append("bpm", uploadBpm);
      fd.append("key", uploadKey);
      fd.append("mood", uploadMood);
      fd.append("tags", uploadTags ? JSON.stringify(uploadTags.split(",").map(t => t.trim()).filter(Boolean)) : "[]");
      fd.append("priceBasic", uploadPriceBasic);
      fd.append("pricePremium", uploadPricePremium);
      fd.append("priceExclusive", uploadPriceExclusive);
      if (uploadFile) fd.append("audio", uploadFile);
      const validCollabs = collabs.filter((c) => c.email.trim() && parseFloat(c.split) > 0);
      if (validCollabs.length > 0) fd.append("collaborators", JSON.stringify(validCollabs));
      const res = await fetch("/api/beats", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "Upload failed");
        return;
      }
      // Reset form and close
      setShowUploadModal(false);
      setUploadTitle(""); setUploadGenre(""); setUploadBpm(""); setUploadKey("");
      setUploadMood(""); setUploadTags(""); setUploadFile(null);
      setUploadPriceBasic("29.99"); setUploadPricePremium("99.99"); setUploadPriceExclusive("299.99");
      // Refresh beats if on that tab
      if (activeTab === "beats") fetchMyBeats();
      else setActiveTab("beats");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const sidebarLinks: { tab: Tab | null; label: string; icon: string }[] = [
    { tab: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { tab: "beats", label: "My Beats", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
    { tab: "earnings", label: "Earnings", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { tab: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { tab: "licensing", label: "Licensing", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { tab: "payouts", label: "Payouts", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
    { tab: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 h-full z-40`}>
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {sidebarOpen && (
            <span className="text-white font-black text-xl bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">WAVR</span>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.name || "Producer"}</p>
                <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/30">Producer</span>
              </div>
            </div>
            <div className="mt-3 bg-gray-800 rounded-lg px-3 py-2">
              <p className="text-gray-500 text-xs">Current Plan</p>
              <p className="text-purple-400 text-sm font-semibold">Pro — $9.99/mo</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => link.tab && setActiveTab(link.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                activeTab === link.tab
                  ? "bg-purple-600/20 text-purple-300 border border-purple-700/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {sidebarOpen && <span>{link.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 text-sm font-medium"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300 p-6 min-h-screen`}>
        {/* Email verification banner */}
        {user && user.verified === false && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-yellow-300 text-sm">
                Please verify your email address to unlock all features.
              </p>
            </div>
            <a
              href="/verify-email"
              className="shrink-0 text-yellow-400 hover:text-yellow-300 text-xs font-semibold underline underline-offset-2 transition-colors"
            >
              Resend link →
            </a>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white">Producer Overview</h1>
              <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}!</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Earnings", value: producerStats ? `$${producerStats.stats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—", color: "text-purple-400" },
                { label: "Beats Sold", value: producerStats ? String(producerStats.stats.beatsSold) : "—", color: "text-fuchsia-400" },
                { label: "Active Licenses", value: producerStats ? String(producerStats.stats.activeLicenses) : "—", color: "text-violet-400" },
                { label: "Monthly Revenue", value: producerStats ? `$${producerStats.stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—", color: "text-pink-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 text-xs font-medium mb-2">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Sales */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold text-base mb-4">Recent Beat Sales</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-gray-800">
                        <th className="text-left pb-3">Beat</th>
                        <th className="text-left pb-3">Buyer</th>
                        <th className="text-left pb-3">License</th>
                        <th className="text-right pb-3">Amount</th>
                        <th className="text-right pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {(producerStats?.recentSales ?? []).map((s, i) => (
                        <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-3 text-white font-medium truncate max-w-[100px]">{s.beat}</td>
                          <td className="py-3 text-gray-400">{s.buyer}</td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              s.license === "Exclusive" ? "bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-700/30" :
                              s.license === "Premium" ? "bg-purple-900/40 text-purple-300 border border-purple-700/30" :
                              "bg-gray-800 text-gray-400 border border-gray-700"
                            }`}>{s.license}</span>
                          </td>
                          <td className="py-3 text-right text-green-400 font-semibold">${s.amount}</td>
                          <td className="py-3 text-right text-gray-500 text-xs">{s.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Beats Chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold text-base mb-4">Top 5 Performing Beats</h2>
                <div className="space-y-3">
                  {(producerStats?.topBeats ?? []).map((beat, i) => {
                    const maxRev = Math.max(...(producerStats?.topBeats ?? [{ revenue: 1 }]).map(b => b.revenue), 1);
                    return (
                      <div key={beat.name} className="flex items-center gap-3">
                        <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-300 text-xs font-medium">{beat.name}</span>
                            <span className="text-purple-400 text-xs font-bold">${beat.revenue.toFixed(0)}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full"
                              style={{ width: `${(beat.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SVG mini bar chart */}
                <div className="mt-6">
                  <p className="text-gray-500 text-xs mb-3">Revenue comparison</p>
                  <svg viewBox="0 0 300 80" className="w-full h-20">
                    {(producerStats?.topBeats ?? []).map((beat, i) => {
                      const maxRev = Math.max(...(producerStats?.topBeats ?? [{ revenue: 1 }]).map(b => b.revenue), 1);
                      const barH = (beat.revenue / maxRev) * 60;
                      const x = i * 60 + 10;
                      return (
                        <g key={beat.name}>
                          <rect
                            x={x}
                            y={70 - barH}
                            width={40}
                            height={barH}
                            rx={4}
                            fill="url(#purpleGrad)"
                            opacity={0.8}
                          />
                          <text x={x + 20} y={78} textAnchor="middle" fill="#6b7280" fontSize={7}>
                            {beat.name.split(" ")[0]}
                          </text>
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-white font-bold text-base mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowUploadModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  + Upload New Beat
                </button>
                <button onClick={() => setActiveTab("licensing")} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors border border-gray-700">
                  View Licenses
                </button>
                <button onClick={() => setActiveTab("payouts")} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors border border-gray-700">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Beats Tab */}
        {activeTab === "beats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-white">My Beats</h1>
              <button onClick={() => setShowUploadModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                + Upload New Beat
              </button>
            </div>

            {beatsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-36 bg-gray-800" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="grid grid-cols-3 gap-2">
                        {[0,1,2].map(j => <div key={j} className="h-12 bg-gray-800 rounded-lg" />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : myBeatsData.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
                <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-gray-400 font-semibold mb-1">No beats yet</p>
                <p className="text-gray-600 text-sm mb-4">Upload your first beat to start selling</p>
                <button onClick={() => setShowUploadModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  + Upload New Beat
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myBeatsData.map((beat) => (
                  <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-700/40 transition-all group">
                    <div className="h-36 bg-gradient-to-br from-purple-900 via-gray-900 to-black relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-purple-700/60" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 text-xs text-gray-300 px-2 py-1 rounded-full">{beat.genre}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          beat.status === "active" ? "bg-green-900/60 text-green-300 border border-green-700/30" :
                          beat.status === "draft" ? "bg-gray-800 text-gray-400 border border-gray-700" :
                          "bg-amber-900/40 text-amber-300 border border-amber-700/30"
                        }`}>{beat.status === "active" ? "Live" : beat.status === "draft" ? "Draft" : beat.status}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold text-sm mb-1">{beat.title}</h3>
                      <p className="text-gray-500 text-xs mb-3">{beat.bpm} BPM · {beat.key}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-white text-xs font-bold">{beat.plays >= 1000 ? `${(beat.plays/1000).toFixed(1)}k` : beat.plays}</p>
                          <p className="text-gray-500 text-xs">Plays</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-white text-xs font-bold">{beat.sales}</p>
                          <p className="text-gray-500 text-xs">Sales</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                          <p className="text-purple-400 text-xs font-bold">${beat.revenue.toFixed(0)}</p>
                          <p className="text-gray-500 text-xs">Revenue</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold py-2 rounded-lg transition-colors border border-purple-700/30">Edit</button>
                        {beat.audioFile && (
                          <a href={beat.audioFile} target="_blank" rel="noreferrer" className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-semibold py-2 rounded-lg transition-colors border border-gray-700">Preview</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Earnings</h1>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Lifetime Earnings", value: producerStats ? `$${producerStats.stats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—", sub: "All time" },
                { label: "This Month", value: producerStats ? `$${producerStats.stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—", sub: "Current month" },
                { label: "Beats Sold", value: producerStats ? String(producerStats.stats.beatsSold) : "—", sub: "Total licenses issued" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-purple-400">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-white font-bold mb-4">Monthly Earnings (Last 12 Months)</h2>
              <svg viewBox="0 0 600 120" className="w-full h-32">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {(() => {
                  const data = producerStats?.monthlyEarnings ?? Array(12).fill(0);
                  const max = Math.max(...data, 1);
                  const pts = data.map((v, i) => {
                    const x = (i / 11) * 560 + 20;
                    const y = 100 - (v / max) * 80;
                    return `${x},${y}`;
                  }).join(" ");
                  const areaFirst = `20,100`;
                  const areaLast = `580,100`;
                  const months = ["A","M","J","J","A","S","O","N","D","J","F","M"];
                  return (
                    <>
                      <polygon points={`${areaFirst} ${pts} ${areaLast}`} fill="url(#lineGrad)" />
                      <polyline points={pts} fill="none" stroke="#a855f7" strokeWidth={2} />
                      {data.map((v, i) => {
                        const x = (i / 11) * 560 + 20;
                        const y = 100 - (v / max) * 80;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r={3} fill="#a855f7" />
                            <text x={x} y={115} textAnchor="middle" fill="#6b7280" fontSize={9}>{months[i]}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Earnings by license type */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Earnings by License Type</h2>
                {(() => {
                  const eb = producerStats?.earningsByType ?? { basic: 0, premium: 0, exclusive: 0 };
                  const total = eb.basic + eb.premium + eb.exclusive || 1;
                  return [
                    { type: "Basic", amount: eb.basic, pct: Math.round((eb.basic / total) * 100), color: "bg-gray-600" },
                    { type: "Premium", amount: eb.premium, pct: Math.round((eb.premium / total) * 100), color: "bg-purple-600" },
                    { type: "Exclusive", amount: eb.exclusive, pct: Math.round((eb.exclusive / total) * 100), color: "bg-fuchsia-600" },
                  ];
                })().map((l) => (
                  <div key={l.type} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300 text-sm">{l.type}</span>
                      <span className="text-white font-semibold text-sm">${l.amount.toLocaleString()} ({l.pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${l.color} rounded-full`} style={{ width: `${l.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Payout History</h2>
                <div className="space-y-3">
                  {(producerStats?.payoutHistory ?? []).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{p.date}</p>
                        <p className="text-gray-500 text-xs">{p.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">${p.amount.toLocaleString()}</p>
                        <span className="text-xs text-green-500 bg-green-900/30 px-2 py-0.5 rounded-full">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Analytics</h1>

            {/* Real stats from API */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Plays", value: myBeatsData.reduce((s, b) => s + b.plays, 0).toLocaleString() },
                { label: "Licenses Sold", value: (producerStats?.stats.beatsSold ?? 0).toString() },
                { label: "Monthly Revenue", value: `$${(producerStats?.stats.monthlyRevenue ?? 0).toFixed(2)}` },
                { label: "Total Earnings", value: `$${(producerStats?.stats.totalEarnings ?? 0).toFixed(2)}` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                  <p className="text-xl font-black text-white">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Earnings by license type */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Revenue by License Type</h2>
                {producerStats ? (() => {
                  const et = producerStats.earningsByType;
                  const total = et.basic + et.premium + et.exclusive || 1;
                  return [
                    { label: "Basic", amount: et.basic, color: "bg-purple-500" },
                    { label: "Premium", amount: et.premium, color: "bg-fuchsia-500" },
                    { label: "Exclusive", amount: et.exclusive, color: "bg-violet-500" },
                  ].map((t) => (
                    <div key={t.label} className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">{t.label}</span>
                        <span className="text-white font-medium">${t.amount.toFixed(2)} ({Math.round((t.amount / total) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${t.color} rounded-full`} style={{ width: `${(t.amount / total) * 100}%` }} />
                      </div>
                    </div>
                  ));
                })() : <p className="text-gray-600 text-sm">Loading…</p>}
              </div>

              {/* Monthly earnings chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-bold mb-4">Monthly Earnings (12 months)</h2>
                {producerStats ? (() => {
                  const max = Math.max(...producerStats.monthlyEarnings, 1);
                  return (
                    <div className="flex items-end gap-1 h-24">
                      {producerStats.monthlyEarnings.map((v, i) => (
                        <div
                          key={i}
                          title={`$${v.toFixed(2)}`}
                          className="flex-1 bg-purple-600/40 hover:bg-purple-500/60 rounded-sm transition-colors"
                          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "4px" : "0" }}
                        />
                      ))}
                    </div>
                  );
                })() : <div className="h-24 bg-gray-800 animate-pulse rounded" />}

                {/* Top beats */}
                {(producerStats?.topBeats ?? []).length > 0 && (
                  <div className="mt-5 border-t border-gray-800 pt-4">
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Top Beats by Revenue</h3>
                    {(producerStats?.topBeats ?? []).map((b, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                        <span className="text-gray-300 text-sm truncate max-w-[60%]">{b.name}</span>
                        <span className="text-purple-400 font-bold text-sm">${b.revenue.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Licensing Tab */}
        {activeTab === "licensing" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Licensing</h1>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h2 className="text-white font-bold">Active License Agreements</h2>
                <p className="text-gray-500 text-sm mt-1">{producerStats?.licenseAgreements.length ?? 0} total agreements</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50">
                    <tr className="text-gray-400 text-xs">
                      <th className="text-left px-5 py-3">Beat</th>
                      <th className="text-left px-5 py-3">Buyer</th>
                      <th className="text-left px-5 py-3">License Type</th>
                      <th className="text-left px-5 py-3">Purchase Date</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(producerStats?.licenseAgreements ?? []).length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-600">No licenses sold yet.</td></tr>
                    ) : (producerStats?.licenseAgreements ?? []).map((l, i) => (
                      <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-4 text-white font-medium">{l.beat}</td>
                        <td className="px-5 py-4 text-gray-400">{l.buyer}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            l.type === "Exclusive" ? "bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-700/30" :
                            l.type === "Premium" ? "bg-purple-900/40 text-purple-300 border border-purple-700/30" :
                            "bg-gray-800 text-gray-400 border border-gray-700"
                          }`}>{l.type}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{l.date}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            l.status === "Active" ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"
                          }`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <PayoutsTab producerStats={producerStats} />
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <ProducerSettings userName={user?.name} userEmail={user?.email} userPlan={user?.plan} />
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Upload New Beat</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File drop */}
              <div
                className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-purple-600 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.flac"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploadFile ? (
                  <p className="text-purple-300 text-sm font-medium">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Click to select audio file</p>
                    <p className="text-gray-600 text-xs mt-1">MP3, WAV, FLAC up to 50MB</p>
                  </>
                )}
              </div>

              {/* Required fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Beat Title *</label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Enter beat title" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Genre *</label>
                  <select value={uploadGenre} onChange={e => setUploadGenre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select genre</option>
                    {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Mood</label>
                  <select value={uploadMood} onChange={e => setUploadMood(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select mood</option>
                    {["Dark","Chill","Energetic","Aggressive","Happy","Melancholic","Motivated","Romantic"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">BPM *</label>
                  <input value={uploadBpm} onChange={e => setUploadBpm(e.target.value)} type="number" min="40" max="250" placeholder="140" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Key *</label>
                  <input value={uploadKey} onChange={e => setUploadKey(e.target.value)} placeholder="e.g. F# Minor" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
                  <input value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="dark, heavy, melodic" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Pricing</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Basic", value: uploadPriceBasic, set: setUploadPriceBasic },
                    { label: "Premium", value: uploadPricePremium, set: setUploadPricePremium },
                    { label: "Exclusive", value: uploadPriceExclusive, set: setUploadPriceExclusive },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="text-gray-500 text-xs block mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input value={value} onChange={e => set(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaborators / Split Sheet */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs font-medium">Collaborators & Split Sheet</p>
                  <button
                    type="button"
                    onClick={() => setCollabs([...collabs, { email: "", split: "", role: "co-producer" }])}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >+ Add Collaborator</button>
                </div>
                {collabs.length > 0 && (
                  <div className="space-y-2">
                    {collabs.map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="email" value={c.email}
                          onChange={(e) => setCollabs(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                          placeholder="producer@email.com"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                        <div className="relative w-20">
                          <input
                            type="number" min="1" max="99" value={c.split}
                            onChange={(e) => setCollabs(prev => prev.map((x, j) => j === i ? { ...x, split: e.target.value } : x))}
                            placeholder="%"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 pr-6"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                        <select
                          value={c.role}
                          onChange={(e) => setCollabs(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-gray-400 text-xs focus:outline-none"
                        >
                          <option value="co-producer">Co-Producer</option>
                          <option value="mixing">Mixing</option>
                          <option value="mastering">Mastering</option>
                          <option value="samples">Samples</option>
                        </select>
                        <button type="button" onClick={() => setCollabs(prev => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                    <p className="text-gray-600 text-xs">
                      Remaining {Math.max(0, 100 - collabs.reduce((s, c) => s + (parseFloat(c.split) || 0), 0))}% goes to you.
                      Revenue splits automatically on every sale.
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{uploadError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  {uploading ? "Uploading..." : "Upload Beat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
