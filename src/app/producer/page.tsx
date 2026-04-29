"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/PlayerContext";
import { supabase } from "@/lib/supabaseClient";

const genreGradients: Record<string, string> = {
  Trap:      "from-red-900 via-gray-900 to-black",
  "R&B":     "from-blue-900 via-indigo-900 to-black",
  Afrobeats: "from-orange-800 via-yellow-900 to-black",
  Drill:     "from-gray-800 via-slate-900 to-black",
  Pop:       "from-pink-900 via-fuchsia-900 to-black",
  "Hip-Hop": "from-purple-900 via-violet-900 to-black",
};


interface MyBeat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  description?: string | null;
  priceBasic: number;
  pricePremium: number;
  priceExclusive: number;
  plays: number;
  sales: number;
  revenue: number;
  status: string;
  featured: boolean;
  audioFile?: string | null;
  artwork?: string | null;
  stems?: { type: string; status: string }[];
  type?: string;
  kitFiles?: string[];
  createdAt: string;
}


type Tab = "overview" | "beats" | "sound-kits" | "collections" | "merch" | "earnings" | "analytics" | "licensing" | "payouts" | "settings";

const sidebarLinks = [
  { label: "Overview",  tab: "overview",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "My Beats",  tab: "beats",     icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
  { label: "Sound Kits", tab: "sound-kits", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Collections", tab: "collections", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "My Merch",  tab: "merch",     icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { label: "Earnings",  tab: "earnings",  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 16v-1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Analytics", tab: "analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { label: "Licensing", tab: "licensing", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Payouts",   tab: "payouts",   icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Settings",  tab: "settings",  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];


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

function MerchTab() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("T-Shirts");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMerch();
  }, []);

  async function fetchMerch() {
    try {
      const res = await fetch("/api/merch/mine");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }

  async function handleAddMerch(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price || !file) return;
    setAdding(true);
    const fd = new FormData();
    fd.append("name", name);
    fd.append("category", category);
    fd.append("price", price);
    fd.append("image", file);
    try {
      await fetch("/api/merch", { method: "POST", body: fd });
      setName(""); setPrice(""); setFile(null);
      fetchMerch();
    } catch {}
    setAdding(false);
  }

  const [printfulConnected, setPrintfulConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Check connection status on load
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => { if (d.printfulToken) setPrintfulConnected(true); })
      .catch(() => {});
  }, []);

  async function handleConnectPrintful() {
    if (!tokenInput) return;
    try {
      const res = await fetch("/api/printful/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput }),
      });
      if (res.ok) {
        setPrintfulConnected(true);
        setShowTokenInput(false);
      } else {
        alert("Failed to connect Printful.");
      }
    } catch {
      alert("Network error connecting Printful.");
    }
  }

  async function handleSyncPrintful() {
    setSyncing(true);
    try {
      const res = await fetch("/api/printful/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully synced ${data.count} products from Printful!`);
        fetchMerch();
      } else {
        alert(data.error || "Failed to sync Printful products.");
      }
    } catch {
      alert("Network error during sync.");
    } finally {
      setSyncing(false);
    }
  }

  const merchServices = [
    { id: "setup", name: "Pro Store Setup", price: 49.99, desc: "We optimize your Printful settings, shipping, and tax profiles." },
    { id: "design-basic", name: "Basic Logo/Graphic", price: 29.99, desc: "Professional high-res graphic for 1 item." },
    { id: "design-full", name: "Collection Design", price: 149.99, desc: "A full themed collection (5 items) with custom artwork." },
  ];

  async function handleOrderService(serviceId: string) {
    if (!confirm("Order this service? The amount will be charged to your account balance.")) return;
    try {
      const res = await fetch("/api/merch/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Service requested successfully! We will contact you soon.");
      } else {
        alert(data.error || "Failed to request service.");
      }
    } catch {
      alert("Network error.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl font-black text-white">My Merch</h1>
          {user?.balance !== undefined && (
            <div className="bg-green-900/20 border border-green-800/30 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest">Balance</span>
              <span className="text-white font-black text-sm">${user?.balance?.toFixed(2) ?? "0.00"}</span>
            </div>
          )}
        </div>
        
        {/* Printful Integration Box */}
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-2 px-4">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold leading-tight">Printful Dropshipping</p>
            <p className="text-gray-500 text-[10px]">Zero inventory. Auto-fulfillment.</p>
          </div>
          {printfulConnected ? (
            <button 
              onClick={handleSyncPrintful}
              disabled={syncing}
              className="ml-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
            >
              {syncing ? "Syncing..." : "Sync Store"}
            </button>
          ) : showTokenInput ? (
            <div className="flex items-center gap-2 ml-2">
              <input 
                type="password" 
                placeholder="Access Token" 
                value={tokenInput} 
                onChange={(e) => setTokenInput(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none w-32"
              />
              <button 
                onClick={handleConnectPrintful}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowTokenInput(true)}
              className="ml-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
      
      {/* Add Merch Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add New Merch Product</h2>
        <form onSubmit={handleAddMerch} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Product Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="e.g. Logo Hoodie" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
              <option>T-Shirts</option>
              <option>Hoodies</option>
              <option>Hats</option>
              <option>Phone Cases</option>
              <option>Tote Bags</option>
              <option>Posters</option>
              <option>Mugs</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Price ($)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="29.99" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-900/50" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={adding} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl transition-all">
              {adding ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Merch List */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Your Products</h2>
        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">You haven't added any merch yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-gray-800 rounded-xl p-4 flex gap-4">
                <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} className="w-20 h-20 object-cover rounded-lg bg-gray-900" />
                <div>
                  <h3 className="text-white font-bold text-sm">{p.name}</h3>
                  <p className="text-gray-400 text-xs">{p.category}</p>
                  <p className="text-purple-400 font-bold mt-2">${p.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merch Services */}
      <div className="bg-gradient-to-br from-red-950/20 to-gray-900 border border-red-900/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Merch Design & Setup Services</h2>
            <p className="text-gray-500 text-sm">Need help growing your brand? Hire our experts.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {merchServices.map((s) => (
            <div key={s.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-5 hover:border-red-600/40 transition-all group">
              <h3 className="text-white font-bold text-lg mb-1">{s.name}</h3>
              <p className="text-red-500 font-black text-xl mb-3">${s.price}</p>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">{s.desc}</p>
              <button 
                onClick={() => handleOrderService(s.id)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                Order Service
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProducerSettings({ userName, userEmail, userPlan }: { userName?: string; userEmail?: string; userPlan?: string }) {
  const [name, setName] = useState(userName ?? "");
  const [bio, setBio] = useState("");
  const [themeColor, setThemeColor] = useState("purple");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { 
        setName(d.name ?? ""); 
        setBio(d.bio ?? ""); 
        setThemeColor(d.themeColor ?? "purple");
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("bio", bio);
      fd.append("themeColor", themeColor);
      if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile) fd.append("coverImage", coverFile);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Failed to save"); return; }
      setMsg("Profile updated successfully.");
      setAvatarFile(null);
      setCoverFile(null);
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confPass) { setPassMsg("Passwords do not match."); return; }
    if (newPass.length < 8) { setPassMsg("New password must be at least 8 characters."); return; }
    
    setPassLoading(true); setPassMsg("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setPassMsg(data.error ?? "Failed to change password."); return; }
      setPassMsg("Password changed successfully!");
      setCurrPass(""); setNewPass(""); setConfPass("");
    } catch { setPassMsg("Network error."); }
    finally { setPassLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Profile Customization</h2>
          {msg && <p className={`text-sm ${msg.includes("success") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
          
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Display Name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              required maxLength={100}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Avatar Image</label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Cover Image</label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Theme Color</label>
            <select
              value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="purple">Purple (Default)</option>
              <option value="blue">Ocean Blue</option>
              <option value="red">Ruby Red</option>
              <option value="green">Emerald Green</option>
              <option value="gray">Monochrome</option>
              <option value="crimson-nights">Crimson Nights (Red/Navy)</option>
              <option value="cyber-yellow">Cyber Yellow (Yellow/Slate)</option>
              <option value="neon-blue">Neon Blue (Deep Blue/Cyan)</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Bio <span className="text-gray-600">({bio.length}/500)</span></label>
            <textarea
              value={bio} onChange={(e) => setBio(e.target.value)}
              maxLength={500} rows={3}
              placeholder="Tell fans about yourself…"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          
          <button
            type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
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

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Change Password</h2>
          {passMsg && <p className={`text-sm ${passMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>{passMsg}</p>}
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Current Password</label>
              <input
                type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">New Password</label>
              <input
                type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Confirm New Password</label>
              <input
                type="password" value={confPass} onChange={e => setConfPass(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit" disabled={passLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl border border-gray-700 transition-colors disabled:opacity-50"
            >
              {passLoading ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function ProducerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { currentBeat, isPlaying, setCurrentBeat } = usePlayer();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadPriceBasic, setUploadPriceBasic] = useState("29.99");
  const [uploadPricePremium, setUploadPricePremium] = useState("99.99");
  const [uploadPriceExclusive, setUploadPriceExclusive] = useState("299.99");
  const [uploadType, setUploadType] = useState("beat");
  const [kitFiles, setKitFiles] = useState<File[]>([]);
  
  // AI Artwork Generation
  const [artworkPrompt, setArtworkPrompt] = useState("");
  const [generatingArtwork, setGeneratingArtwork] = useState(false);
  const [artworkError, setArtworkError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [detectingBpm, setDetectingBpm] = useState(false);
  const [detectError, setDetectError] = useState("");

  // Edit beat state
  const [editBeat, setEditBeat] = useState<MyBeat | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editBpm, setEditBpm] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPriceBasic, setEditPriceBasic] = useState("");
  const [editPricePremium, setEditPricePremium] = useState("");
  const [editPriceExclusive, setEditPriceExclusive] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editArtworkFile, setEditArtworkFile] = useState<File | null>(null);
  const [editArtworkPreview, setEditArtworkPreview] = useState<string | null>(null);
  const editArtworkRef = useRef<HTMLInputElement>(null);

  const [collabs, setCollabs] = useState<{ email: string; split: string; role: string }[]>([]);
  const [separatingStems, setSeparatingStems] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMyBeats = useMemo(() => {
    if (activeTab === "beats") return myBeatsData.filter(b => b.type === "beat" || !b.type);
    if (activeTab === "sound-kits") return myBeatsData.filter(b => b.type === "sound-kit");
    if (activeTab === "collections") return myBeatsData.filter(b => b.type === "collection");
    return myBeatsData;
  }, [myBeatsData, activeTab]);

  useEffect(() => {
    if (activeTab === "beats" || activeTab === "sound-kits" || activeTab === "collections" || activeTab === "analytics") {
      fetchMyBeats();
    }
  }, [activeTab]);

  async function fetchMyBeats() {
    setBeatsLoading(true);
    try {
      const res = await fetch("/api/beats/mine");
      if (res.ok) setMyBeatsData(await res.json());
    } catch (error) {
      console.warn("Could not fetch beats:", error);
    } finally {
      setBeatsLoading(false);
    }
  }

  async function handleGenerateArtwork() {
    if (!artworkPrompt) return;
    setGeneratingArtwork(true);
    setArtworkError("");
    try {
      const res = await fetch("/api/beats/generate-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: artworkPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      // Update preview and store the URL
      setEditArtworkPreview(data.imageUrl);
      // If we're in the upload modal, we'll use this preview URL
    } catch (err: any) {
      setArtworkError(err.message);
    } finally {
      setGeneratingArtwork(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    const isBeat = uploadType === "beat";
    if (!uploadTitle || !uploadGenre || (isBeat && (!uploadBpm || !uploadKey))) {
      setUploadError(isBeat ? "Title, genre, BPM, and key are required." : "Title and genre are required.");
      return;
    }
    setUploading(true);
    try {
      let finalAudioUrl = "";

      if (uploadFile) {
        // 1. Upload audio to Supabase Storage
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `beats/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('beats')
          .upload(filePath, uploadFile);

        if (uploadError) {
          console.error("Supabase Publish Audio Error:", uploadError);
          setUploadError(`Audio upload failed: ${uploadError.message} (Check console)`);
          return;
        }

        // 2. Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('beats')
          .getPublicUrl(filePath);
        
        finalAudioUrl = publicUrl;
      }

      let finalArtworkUrl = "";
      if (editArtworkFile) {
        const fileExt = editArtworkFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `artwork/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('beats').upload(filePath, editArtworkFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('beats').getPublicUrl(filePath);
          finalArtworkUrl = publicUrl;
        }
      } else if (editArtworkPreview && editArtworkPreview.startsWith('http')) {
        // Use the AI generated URL directly
        finalArtworkUrl = editArtworkPreview;
      }

      let uploadedKitFiles: string[] = [];
      if (uploadType === "sound-kit" && kitFiles.length > 0) {
        for (const f of kitFiles) {
          const fileExt = f.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `kits/${fileName}`;
          const { error: kitUploadError } = await supabase.storage.from('beats').upload(filePath, f);
          if (!kitUploadError) {
            const { data: { publicUrl } } = supabase.storage.from('beats').getPublicUrl(filePath);
            uploadedKitFiles.push(publicUrl);
          }
        }
      }

      const fd = new FormData();
      fd.append("title", uploadTitle);
      fd.append("genre", uploadGenre);
      fd.append("bpm", uploadBpm || "0");
      fd.append("key", uploadKey || "N/A");
      fd.append("mood", uploadMood);
      fd.append("description", uploadDescription);
      fd.append("tags", uploadTags ? JSON.stringify(uploadTags.split(",").map(t => t.trim()).filter(Boolean)) : "[]");
      fd.append("priceBasic", uploadPriceBasic);
      fd.append("pricePremium", uploadPricePremium);
      fd.append("priceExclusive", uploadPriceExclusive);
      
      // Send the Supabase URL instead of the raw file
      if (finalAudioUrl) fd.append("audioUrl", finalAudioUrl);
      if (finalArtworkUrl) fd.append("artworkUrl", finalArtworkUrl);
      fd.append("type", uploadType);
      if (uploadedKitFiles.length > 0) fd.append("kitFiles", JSON.stringify(uploadedKitFiles));

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
      setUploadMood(""); setUploadDescription(""); setUploadTags(""); setUploadFile(null);
      setUploadPriceBasic("29.99"); setUploadPricePremium("99.99"); setUploadPriceExclusive("299.99");
      setUploadType("beat"); setKitFiles([]);
      setEditArtworkFile(null); setEditArtworkPreview(null); setArtworkPrompt("");
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

  function openEditModal(beat: MyBeat) {
    setEditBeat(beat);
    setEditTitle(beat.title);
    setEditGenre(beat.genre);
    setEditBpm(String(beat.bpm));
    setEditKey(beat.key);
    setEditMood(beat.mood ?? "");
    setEditDescription(beat.description ?? "");
    setEditTags("");
    setEditPriceBasic(String(beat.priceBasic));
    setEditPricePremium(String(beat.pricePremium ?? ""));
    setEditPriceExclusive(String(beat.priceExclusive ?? ""));
    setEditStatus(beat.status);
    setEditError("");
    setEditArtworkFile(null);
    setEditArtworkPreview(beat.artwork ?? null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBeat) return;
    setEditSaving(true);
    setEditError("");
    try {
      let finalArtworkUrl = editArtworkPreview;

      if (editArtworkFile) {
        // 1. Upload artwork to Supabase
        const fileExt = editArtworkFile.name.split('.').pop();
        const fileName = `artwork-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `artworks/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('beats')
          .upload(filePath, editArtworkFile);

        if (uploadError) {
          console.error("Supabase Edit Artwork Error:", uploadError);
          setEditError(`Artwork upload failed: ${uploadError.message} (Check console)`);
          setEditSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('beats')
          .getPublicUrl(filePath);
        
        finalArtworkUrl = publicUrl;
      }

      const res = await fetch(`/api/beats/${editBeat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          genre: editGenre,
          bpm: parseInt(editBpm, 10),
          key: editKey.trim(),
          mood: editMood,
          description: editDescription,
          tags: editTags ? editTags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
          priceBasic: parseFloat(editPriceBasic),
          pricePremium: parseFloat(editPricePremium),
          priceExclusive: parseFloat(editPriceExclusive),
          status: editStatus,
          artworkUrl: finalArtworkUrl
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? "Update failed");
        return;
      }
      setEditBeat(null);
      setEditArtworkFile(null);
      setEditArtworkPreview(null);
      fetchMyBeats();

    } catch {
      setEditError("Network error. Try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteBeat(beatId: string) {
    if (!confirm("Are you sure you want to delete this beat? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/beats/${beatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchMyBeats();
    } catch {
      alert("Failed to delete beat. Try again.");
    }
  }

  const sidebarLinksList = sidebarLinks.map(link => ({
    id: link.label,
    label: link.label,
    icon: link.icon,
    tab: link.tab || undefined
  }));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row">
      {/* Shared Sidebar */}
      <DashboardSidebar
        items={sidebarLinksList}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Producer"
        roleBadge="Producer"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <DashboardHeader
          title={sidebarLinks.find(l => l.tab === activeTab)?.label || "Producer Dashboard"}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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

        {/* My Beats / Sound Kits / Collections Tabs */}
        {(activeTab === "beats" || activeTab === "sound-kits" || activeTab === "collections") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-white">
                {activeTab === "beats" ? "My Beats" : 
                 activeTab === "sound-kits" ? "My Sound Kits" : 
                 "My Collections"}
              </h1>
              <button 
                onClick={() => {
                  setUploadType(activeTab === "beats" ? "beat" : activeTab === "sound-kits" ? "sound-kit" : "collection");
                  setShowUploadModal(true);
                }} 
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                + {activeTab === "beats" ? "Upload New Beat" : 
                   activeTab === "sound-kits" ? "Upload Sound Kit" : 
                   "Create Collection"}
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
            ) : filteredMyBeats.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
                <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-gray-400 font-semibold mb-1">
                  {activeTab === "beats" ? "No beats yet" : 
                   activeTab === "sound-kits" ? "No sound kits yet" : 
                   "No collections yet"}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {activeTab === "beats" ? "Upload your first beat to start selling" : 
                   activeTab === "sound-kits" ? "Create your first sound kit" : 
                   "Bundle your beats into a collection"}
                </p>
                <button 
                  onClick={() => {
                    setUploadType(activeTab === "beats" ? "beat" : activeTab === "sound-kits" ? "sound-kit" : "collection");
                    setShowUploadModal(true);
                  }} 
                  className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  + Create New
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMyBeats.map((beat) => (
                  <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-700/40 transition-all group">

                     {/* Artwork + Play Button */}
                     <div
                       className={`h-44 relative bg-gradient-to-br ${genreGradients[beat.genre] || "from-purple-900 via-gray-900 to-black"} ${beat.audioFile ? "cursor-pointer" : "cursor-default"}`}
                       onClick={() => {
                         if (!beat.audioFile) return;
                         setCurrentBeat({
                           id: beat.id,
                           title: beat.title,
                           producer: user?.name ?? "You",
                           producerId: user?.id ?? "",
                           genre: beat.genre,
                           bpm: beat.bpm,
                           key: beat.key,
                           mood: beat.mood ?? "",
                           tags: [],
                           priceBasic: beat.priceBasic,
                           pricePremium: beat.pricePremium,
                           priceExclusive: beat.priceExclusive,
                           plays: beat.plays,
                           featured: beat.featured,
                           status: beat.status,
                           artwork: beat.artwork ?? null,
                           audioFile: beat.audioFile ?? null,
                         });
                       }}
                     >
                       {/* Artwork image (if available) */}
                       {beat.artwork ? (
                         <img
                           src={beat.artwork}
                           alt={beat.title}
                           className="absolute inset-0 w-full h-full object-cover opacity-70"
                         />
                       ) : (
                         <div className="absolute inset-0 flex items-center justify-center opacity-20">
                           <svg viewBox="0 0 200 60" className="w-full h-16">
                             {Array.from({ length: 32 }, (_, i) => (
                               <rect key={i} x={i * 6.25} y={30 - (i % 5) * 8} width="4" height={16 + (i % 7) * 5} fill="white" opacity={0.6} />
                             ))}
                           </svg>
                         </div>
                       )}

                       {/* Play / Pause button — hidden if no audio */}
                       <div className="absolute inset-0 flex items-center justify-center">
                         {beat.audioFile ? (
                           <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl ${
                             currentBeat?.id === beat.id && isPlaying
                               ? "bg-purple-500 scale-110 shadow-purple-500/50"
                               : "bg-black/50 backdrop-blur-sm group-hover:bg-purple-600/80 group-hover:scale-110"
                           }`}>
                             {currentBeat?.id === beat.id && isPlaying ? (
                               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                               </svg>
                             ) : (
                               <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M8 5v14l11-7z" />
                               </svg>
                             )}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                               </svg>
                             </div>
                             <span className="text-gray-400 text-xs bg-black/60 px-2 py-0.5 rounded-full">No audio file</span>
                           </div>
                         )}
                       </div>

                       {/* Genre badge */}
                       <div className="absolute top-3 left-3">
                         <span className="bg-black/60 backdrop-blur-sm text-xs text-gray-300 px-2.5 py-1 rounded-full border border-gray-700/50">{beat.genre}</span>
                       </div>

                       {/* Status badge */}
                       <div className="absolute top-3 right-3">
                         <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                           beat.status === "active" ? "bg-green-900/60 text-green-300 border border-green-700/30" :
                           beat.status === "draft"  ? "bg-gray-800 text-gray-400 border border-gray-700" :
                           "bg-amber-900/40 text-amber-300 border border-amber-700/30"
                         }`}>{beat.status === "active" ? "Live" : beat.status === "draft" ? "Draft" : beat.status}</span>
                       </div>

                       {/* Play count */}
                       <div className="absolute bottom-3 right-3 flex items-center gap-1">
                         <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                         <span className="text-xs text-gray-400">{beat.plays >= 1000 ? `${(beat.plays/1000).toFixed(1)}k` : beat.plays}</span>
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
                        <div className="flex flex-wrap gap-2 mt-3">
                           <button onClick={() => openEditModal(beat)} className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-[10px] font-bold py-2 rounded-lg transition-colors border border-purple-700/30">Edit</button>
                           <button onClick={() => deleteBeat(beat.id)} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-[10px] font-bold py-2 rounded-lg transition-colors border border-red-800/30">Delete</button>
                          {beat.audioFile && (
                            <button
                              disabled={separatingStems[beat.id] || beat.stems?.some(s => s.status === "processing")}
                              onClick={async () => {
                                setSeparatingStems(prev => ({ ...prev, [beat.id]: true }));
                                try {
                                  const res = await fetch(`/api/beats/${beat.id}/stems`, { method: "POST" });
                                  if (!res.ok) {
                                    const d = await res.json();
                                    alert(d.error || "Failed");
                                  } else {
                                    fetchMyBeats();
                                  }
                                } catch {
                                  alert("Error");
                                } finally {
                                  setSeparatingStems(prev => ({ ...prev, [beat.id]: false }));
                                }
                              }}
                              className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors border ${
                                beat.stems?.some(s => s.status === "ready")
                                  ? "bg-green-900/20 text-green-400 border-green-800/30"
                                  : beat.stems?.some(s => s.status === "processing")
                                  ? "bg-yellow-900/20 text-yellow-400 border-yellow-800/30 animate-pulse"
                                  : "bg-indigo-900/20 text-indigo-300 border-indigo-800/30 hover:bg-indigo-900/40"
                              }`}
                            >
                              {beat.stems?.some(s => s.status === "ready") ? "Stems Ready" : 
                               beat.stems?.some(s => s.status === "processing") ? "Splitting..." :
                               separatingStems[beat.id] ? "Starting..." : "✨ Split Stems"}
                            </button>
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

        {/* Merch Tab */}
        {activeTab === "merch" && (
          <MerchTab />
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <ProducerSettings userName={user?.name} userEmail={user?.email} userPlan={user?.plan} />
        )}
      </main>

      {/* Edit Beat Modal */}
      {editBeat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-bold text-lg">Edit Beat</h2>
                <button 
                  type="button"
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = "✨ Generating...";
                    btn.disabled = true;
                    try {
                      const res = await fetch("/api/ai/suggest-beat", {
                        method: "POST",
                        body: JSON.stringify({ genre: editGenre, mood: editMood }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setEditTitle(data.title);
                        setEditBpm(data.bpm);
                        setEditKey(data.key);
                        if (data.description) setEditDescription(data.description);
                        
                        if (data.artwork) {
                          const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(data.artwork)}`);
                          if (imgRes.ok) {
                            const blob = await imgRes.blob();
                            const file = new File([blob], "ai-artwork.png", { type: "image/png" });
                            setEditArtworkFile(file);
                            setEditArtworkPreview(URL.createObjectURL(file));
                          }
                        }
                      }
                    } catch (err) {
                      console.error("AI Suggestion Error:", err);
                    } finally {
                      btn.innerHTML = originalText;
                      btn.disabled = false;
                    }
                  }}
                  className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded border border-purple-700/30 flex items-center gap-1 transition-all"
                >
                  <span className="text-sm">✨</span> AI Suggest
                </button>
              </div>
              <button onClick={() => setEditBeat(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Title *</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Genre *</label>
                  <select value={editGenre} onChange={e => setEditGenre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select genre</option>
                    {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Mood</label>
                  <select value={editMood} onChange={e => setEditMood(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select mood</option>
                    {["Dark","Chill","Energetic","Aggressive","Happy","Melancholic","Motivated","Romantic"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">BPM *</label>
                  <input value={editBpm} onChange={e => setEditBpm(e.target.value)} type="number" min="40" max="250" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Key *</label>
                  <input value={editKey} onChange={e => setEditKey(e.target.value)} placeholder="e.g. F# Minor" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                    <option value="active">Active (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 items-end">
                  <label className="text-gray-400 text-xs font-medium block">Description</label>
                  <button type="button" onClick={async () => {
                      try {
                        const res = await fetch("/api/ai/suggest-beat", { method: "POST", body: JSON.stringify({ genre: editGenre, mood: editMood }) });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.description) setEditDescription(data.description);
                        }
                      } catch (e) {}
                  }} className="text-purple-400 hover:text-purple-300 text-[10px] font-bold uppercase">✨ AI Generate</button>
                </div>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Describe your beat..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="dark, heavy, melodic" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium mb-2">Pricing</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Basic", value: editPriceBasic, set: setEditPriceBasic },
                    { label: "Premium", value: editPricePremium, set: setEditPricePremium },
                    { label: "Exclusive", value: editPriceExclusive, set: setEditPriceExclusive },
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
              {/* Artwork Upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Artwork</label>
                <div
                  className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 transition-colors cursor-pointer overflow-hidden bg-gray-800/50 group"
                  onClick={() => editArtworkRef.current?.click()}
                >
                  {editArtworkPreview ? (
                    <>
                      <img src={editArtworkPreview} alt="artwork" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-white text-xs font-medium">Change artwork</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-gray-500 text-xs">Click to upload artwork</span>
                      <span className="text-gray-600 text-xs">PNG, JPG, WEBP — max 5MB</span>
                    </div>
                  )}
                  <input
                    ref={editArtworkRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setEditArtworkFile(file);
                      setEditArtworkPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
                
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      value={artworkPrompt} 
                      onChange={e => setArtworkPrompt(e.target.value)} 
                      placeholder="Enter a prompt for AI artwork..."
                      className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArtwork}
                      disabled={generatingArtwork || !artworkPrompt}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingArtwork ? (
                        <>
                          <div className="w-3 h-3 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>✨ Generate</>
                      )}
                    </button>
                  </div>
                  {artworkError && <p className="text-red-500 text-[10px]">{artworkError}</p>}
                </div>

                {editArtworkFile && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400 text-xs truncate max-w-[200px]">{editArtworkFile.name}</span>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                      onClick={() => { setEditArtworkFile(null); setEditArtworkPreview(editBeat?.artwork ?? null); }}
                    >✕ Remove</button>
                  </div>
                )}
              </div>

              {editError && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditBeat(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">
                {uploadType === "beat" ? "Upload New Beat" : 
                 uploadType === "sound-kit" ? "Upload New Sound Kit" : 
                 "Upload New Collection"}
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Type Selector */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Upload Type</label>
                <div className="flex gap-2">
                  {[
                    { id: "beat", label: "Beat", icon: "🎵" },
                    { id: "sound-kit", label: "Sound Kit", icon: "🥁" },
                    { id: "collection", label: "Collection", icon: "📦" }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setUploadType(t.id)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        uploadType === t.id
                          ? "bg-purple-600/20 border-purple-600 text-white"
                          : "bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600"
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-[10px] font-bold uppercase">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                    <p className="text-gray-400 text-sm">
                      {uploadType === "beat" ? "Click to select audio file" : 
                       uploadType === "sound-kit" ? "Select main preview or kit zip" : 
                       "Select collection zip file"}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">MP3, WAV, FLAC or ZIP up to 500MB</p>
                  </>
                )}
              </div>

              {/* Sound Kit Files (Multiple) */}
              {uploadType === "sound-kit" && (
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-medium block">Kit Samples / Files</label>
                  <div className="grid grid-cols-2 gap-2">
                    {kitFiles.map((f, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-300 truncate pr-2">{f.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setKitFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.onchange = (e: any) => {
                          const files = Array.from(e.target.files as FileList);
                          setKitFiles(prev => [...prev, ...files]);
                        };
                        input.click();
                      }}
                      className="border border-dashed border-gray-700 rounded-lg p-2 text-[10px] text-gray-500 hover:border-purple-600 hover:text-purple-400 transition-all flex items-center justify-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                      Add Files
                    </button>
                  </div>
                </div>
              )}

              {/* Required fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">
                    {uploadType === "beat" ? "Beat Title *" : 
                     uploadType === "sound-kit" ? "Sound Kit Title *" : 
                     "Collection Title *"}
                  </label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder={`Enter ${uploadType} title`} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
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
                {uploadType === "beat" && (
                  <>
                    <div>
                      <label className="text-gray-400 text-xs font-medium block mb-1">BPM *</label>
                      <input value={uploadBpm} onChange={e => setUploadBpm(e.target.value)} type="number" min="40" max="250" placeholder="140" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs font-medium block mb-1">Key *</label>
                      <input value={uploadKey} onChange={e => setUploadKey(e.target.value)} placeholder="e.g. F# Minor" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                    </div>
                  </>
                )}

                {/* Auto-detect BPM & Key */}
                <div className="col-span-2">
                  <button
                    type="button"
                    disabled={!uploadFile || detectingBpm}
                    onClick={async () => {
                      if (!uploadFile) return;
                      setDetectingBpm(true);
                      setDetectError("");
                      try {
                        // 1. Upload file to Supabase Storage to bypass Vercel limits
                        const fileExt = uploadFile.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `temp-analyze/${fileName}`;

                        const { data: uploadData, error: uploadError } = await supabase.storage
                          .from('beats')
                          .upload(filePath, uploadFile);

                        if (uploadError) {
                          console.error("Supabase Upload Error Details:", uploadError);
                          setDetectError(`Upload failed: ${uploadError.message} (Check console for details)`);
                          return;
                        }

                        // 2. Get the public URL
                        const { data: { publicUrl } } = supabase.storage
                          .from('beats')
                          .getPublicUrl(filePath);

                        // 3. Send URL to our analyze API
                        const res = await fetch("/api/beats/analyze", { 
                          method: "POST", 
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ audioUrl: publicUrl, originalFileName: uploadFile.name }) 
                        });
                        
                        const data = await res.json();
                        if (!res.ok) { setDetectError(data.error ?? "Detection failed"); return; }
                        
                        if (data.bpm)  setUploadBpm(String(data.bpm));
                        if (data.key)  setUploadKey(data.key);
                        if (data.suggestedTitle && !uploadTitle.trim()) {
                          setUploadTitle(data.suggestedTitle);
                        }
                        if (data.suggestedArtworkPrompt) {
                          setArtworkPrompt(data.suggestedArtworkPrompt);
                        }

                        // Optional: Clean up the temp file from Supabase
                        // await supabase.storage.from('beats').remove([filePath]);

                      } catch (err) {
                        console.error(err);
                        setDetectError("Analysis failed. Please check your connection.");
                      } finally {
                        setDetectingBpm(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                  >
                    {detectingBpm ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Analyzing audio…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        {uploadFile ? "✨ Auto-detect BPM & Key (v2)" : "Select an audio file first"}
                      </>
                    )}
                  </button>
                  {detectError && <p className="text-red-400 text-xs mt-1.5">{detectError}</p>}
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between mb-1 items-end">
                    <label className="text-gray-400 text-xs font-medium block">Description</label>
                    <button type="button" onClick={async () => {
                        try {
                          const res = await fetch("/api/ai/suggest-beat", { method: "POST", body: JSON.stringify({ genre: uploadGenre, mood: uploadMood }) });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.description) setUploadDescription(data.description);
                          }
                        } catch (e) {}
                    }} className="text-purple-400 hover:text-purple-300 text-[10px] font-bold uppercase">✨ AI Generate</button>
                  </div>
                  <textarea 
                    value={uploadDescription} 
                    onChange={e => setUploadDescription(e.target.value)} 
                    placeholder={`Describe your ${uploadType}...`} 
                    rows={3} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  ></textarea>
                </div>

                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
                  <input value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="dark, heavy, melodic" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                </div>
              </div>

              {/* Artwork Upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Artwork</label>
                <div
                  className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 transition-colors cursor-pointer overflow-hidden bg-gray-800/50 group"
                  onClick={() => editArtworkRef.current?.click()}
                >
                  {editArtworkPreview ? (
                    <>
                      <img src={editArtworkPreview} alt="artwork" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-white text-xs font-medium">Change artwork</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-gray-500 text-xs">Click to upload artwork</span>
                      <span className="text-gray-600 text-xs">PNG, JPG, WEBP — max 5MB</span>
                    </div>
                  )}
                  <input
                    type="file" className="hidden" ref={editArtworkRef} accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditArtworkFile(file);
                        setEditArtworkPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                
                {/* AI Generation Controls */}
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      value={artworkPrompt} 
                      onChange={e => setArtworkPrompt(e.target.value)} 
                      placeholder="Enter a prompt for AI artwork..."
                      className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArtwork}
                      disabled={generatingArtwork || !artworkPrompt}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingArtwork ? (
                        <>
                          <div className="w-3 h-3 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>✨ Generate</>
                      )}
                    </button>
                  </div>
                  {artworkError && <p className="text-red-500 text-[10px]">{artworkError}</p>}
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
    </div>
  );
}

