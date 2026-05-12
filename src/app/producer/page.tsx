"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/PlayerContext";
import { supabase } from "@/lib/supabaseClient";
import { uploadAudioToHuggingFace } from "@/lib/uploadFileBrowser";
import { DropZone } from "@/components/DropZone";

const genreGradients: Record<string, string> = {
  Trap:      "from-blue-600 via-gray-900 to-black",
  "R&B":     "from-blue-900 via-indigo-900 to-black",
  Afrobeats: "from-orange-800 via-yellow-900 to-black",
  Drill:     "from-gray-800 via-slate-900 to-black",
  Pop:       "from-pink-900 via-fuchsia-900 to-black",
  "Hip-Hop": "from-blue-600 via-violet-900 to-black",
};


interface MyBeat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
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
  stems?: { type: string; status: string; filePath?: string | null }[];
  createdAt: string;
}


type Tab = "overview" | "beats" | "kits" | "collections" | "merch" | "earnings" | "analytics" | "licensing" | "payouts" | "settings";

const sidebarLinks = [
  { label: "Overview",  tab: "overview",  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "My Beats",       tab: "beats",       icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
  { label: "Sound Kits",    tab: "kits",        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Collections",   tab: "collections", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "My Merch",      tab: "merch",       icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
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
          <p className="text-3xl font-black text-blue-400">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Request payout */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-3">Request Payout</h2>
        {msg && <p className={`text-sm mb-3 ${msg.includes("submitted") ? "text-green-400" : "text-blue-400"}`}>{msg}</p>}
        <form onSubmit={handleRequest} className="flex gap-3 items-end">
          <div>
            <label className="text-gray-500 text-xs block mb-1.5">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number" min="10" step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 w-36"
              />
            </div>
          </div>
          <button
            type="submit" disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-600 hover:to-blue-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
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
                        : "bg-blue-900/30 text-blue-400"
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
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
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
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowTokenInput(true)}
              className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
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
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-600" placeholder="e.g. Logo Hoodie" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-600">
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
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-600" placeholder="29.99" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/30 file:text-blue-400 hover:file:bg-blue-900/30" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={adding} className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-600 hover:to-blue-400 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl transition-all">
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
                  <p className="text-blue-400 font-bold mt-2">${p.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merch Services */}
      <div className="bg-gradient-to-br from-blue-600/20 to-gray-900 border border-red-900/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Merch Design & Setup Services</h2>
            <p className="text-gray-500 text-sm">Need help growing your brand? Hire our experts.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {merchServices.map((s) => (
            <div key={s.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-5 hover:border-blue-500/40 transition-all group">
              <h3 className="text-white font-bold text-lg mb-1">{s.name}</h3>
              <p className="text-blue-400 font-black text-xl mb-3">${s.price}</p>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">{s.desc}</p>
              <button 
                onClick={() => handleOrderService(s.id)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
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

// ─── Sound Kits Tab ──────────────────────────────────────────────────────────
function SoundKitsTab({ userId }: { userId?: string }) {
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("29.99");
  const [tags, setTags] = useState("");
  const [fileCount, setFileCount] = useState("0");
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);

  const fetchKits = () => {
    setLoading(true);
    fetch("/api/sound-kits")
      .then(r => r.json())
      .then(data => setKits((data || []).filter((k: any) => k.producerId === userId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (userId) fetchKits(); }, [userId]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setGenre(""); setPrice("29.99");
    setTags(""); setFileCount("0"); setArtworkFile(null); setPreviewFile(null); setDownloadFile(null);
    setShowForm(false); setMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("title", title); fd.append("description", description);
      fd.append("genre", genre); fd.append("price", price);
      fd.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)));
      fd.append("fileCount", fileCount);
      if (artworkFile) fd.append("artwork", artworkFile);
      if (previewFile) fd.append("preview", previewFile);
      if (downloadFile) fd.append("download", downloadFile);
      const res = await fetch("/api/sound-kits", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); setMsg(d.error || "Failed"); return; }
      setMsg("Sound kit uploaded!");
      resetForm();
      fetchKits();
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  };

  const deleteKit = async (id: string) => {
    if (!confirm("Delete this sound kit?")) return;
    await fetch(`/api/sound-kits/${id}`, { method: "DELETE" });
    fetchKits();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Sound Kits</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          {showForm ? "Cancel" : "+ Upload Kit"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">New Sound Kit</h2>
          {msg && <p className={`text-sm ${msg.includes("uploaded") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="">Select genre</option>
                {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Price ($)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">File Count</label>
              <input value={fileCount} onChange={e => setFileCount(e.target.value)} type="number" min="0"
                placeholder="e.g. 150"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 resize-none" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="dark, trap, 808s"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Artwork</label>
              <DropZone accept="image/*" label="Drop or click" hint="PNG, JPG, WEBP" file={artworkFile} onChange={setArtworkFile} />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Preview Audio</label>
              <DropZone accept="audio/*" label="Drop or click" hint="MP3, WAV" file={previewFile} onChange={setPreviewFile} />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Download ZIP</label>
              <DropZone accept=".zip,.rar,.7z" label="Drop or click" hint="ZIP, RAR, 7Z" file={downloadFile} onChange={setDownloadFile} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-colors">
            {saving ? "Uploading…" : "Upload Sound Kit"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : kits.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-gray-500 text-sm">No sound kits yet. Upload your first kit above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map(kit => (
            <div key={kit.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all">
              {kit.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kit.artwork} alt={kit.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate">{kit.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{kit.genre || "—"} · {kit.fileCount} files</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-blue-400 font-bold">${kit.price}</span>
                  <button onClick={() => deleteKit(kit.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Collections Tab ──────────────────────────────────────────────────────────
function CollectionsTab({ userId }: { userId?: string }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [myBeats, setMyBeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("49.99");
  const [tags, setTags] = useState("");
  const [selectedBeats, setSelectedBeats] = useState<string[]>([]);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/collections").then(r => r.json()),
      fetch("/api/beats/mine").then(r => r.json()),
    ]).then(([cols, beats]) => {
      setCollections((cols || []).filter((c: any) => c.producerId === userId));
      setMyBeats(beats || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { if (userId) fetchData(); }, [userId]);

  const toggleBeat = (id: string) =>
    setSelectedBeats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setGenre(""); setPrice("49.99");
    setTags(""); setSelectedBeats([]); setArtworkFile(null);
    setShowForm(false); setMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("title", title); fd.append("description", description);
      fd.append("genre", genre); fd.append("price", price);
      fd.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)));
      fd.append("beatIds", JSON.stringify(selectedBeats));
      if (artworkFile) fd.append("artwork", artworkFile);
      const res = await fetch("/api/collections", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); setMsg(d.error || "Failed"); return; }
      setMsg("Collection created!");
      resetForm();
      fetchData();
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Collections</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          {showForm ? "Cancel" : "+ Create Collection"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">New Collection / Beat Pack</h2>
          {msg && <p className={`text-sm ${msg.includes("created") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                <option value="">Select genre</option>
                {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Bundle Price ($)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Artwork</label>
              <DropZone accept="image/*" label="Drop or click" hint="PNG, JPG, WEBP" file={artworkFile} onChange={setArtworkFile} />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 resize-none" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="dark, trap, melodic"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Select Beats to Include</label>
            {myBeats.length === 0 ? (
              <p className="text-gray-500 text-xs">Upload some beats first to add them to a collection.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {myBeats.map((beat: any) => (
                  <label key={beat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedBeats.includes(beat.id) ? "bg-blue-900/30 border-blue-600" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                    <input type="checkbox" checked={selectedBeats.includes(beat.id)} onChange={() => toggleBeat(beat.id)} className="accent-blue-500" />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{beat.title}</p>
                      <p className="text-gray-500 text-xs">{beat.genre} · {beat.bpm} BPM</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selectedBeats.length > 0 && (
              <p className="text-blue-400 text-xs mt-2">{selectedBeats.length} beat{selectedBeats.length > 1 ? "s" : ""} selected</p>
            )}
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-colors">
            {saving ? "Creating…" : "Create Collection"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <p className="text-gray-500 text-sm">No collections yet. Create your first beat pack above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <div key={col.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all">
              {col.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={col.artwork} alt={col.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate">{col.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{col.genre || "—"} · {col.beatCount ?? 0} beats</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-blue-400 font-bold">${col.price}</span>
                  <button onClick={() => deleteCollection(col.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const GENRES = ["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"];
const MOODS  = ["Dark","Chill","Energetic","Aggressive","Happy","Melancholic","Motivated","Romantic"];

function ProducerSettings({ userName, userEmail, userPlan }: { userName?: string; userEmail?: string; userPlan?: string }) {
  const [name, setName] = useState(userName ?? "");
  const [bio, setBio] = useState("");
  // themeColor removed — profiles use WAVR's consistent blue/teal design
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tagAudioFile, setTagAudioFile] = useState<File | null>(null);
  const [currentTagAudio, setCurrentTagAudio] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({ twitter: "", instagram: "", youtube: "", soundcloud: "", spotify: "", website: "" });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.name ?? "");
        setBio(d.bio ?? "");
        setCurrentTagAudio(d.tagAudio ?? null);
        if (d.socialLinks) { try { setSocialLinks(prev => ({ ...prev, ...JSON.parse(d.socialLinks) })); } catch {} }
        if (d.genres) { try { setSelectedGenres(JSON.parse(d.genres)); } catch {} }
        if (d.moods) { try { setSelectedMoods(JSON.parse(d.moods)); } catch {} }
      })
      .catch(() => {});
  }, []);

  const toggleGenre = (g: string) => setSelectedGenres(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleMood  = (m: string) => setSelectedMoods(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("bio", bio);
      fd.append("socialLinks", JSON.stringify(socialLinks));
      fd.append("genres", JSON.stringify(selectedGenres));
      fd.append("moods", JSON.stringify(selectedMoods));
      if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile) fd.append("coverImage", coverFile);
      if (tagAudioFile) fd.append("tagAudio", tagAudioFile);

      const res = await fetch("/api/profile", { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Failed to save"); return; }
      setMsg("Profile updated successfully.");
      setAvatarFile(null); setCoverFile(null); setTagAudioFile(null);
      if (data.tagAudio) setCurrentTagAudio(data.tagAudio);
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold">Profile</h2>
            {msg && <p className={`text-sm ${msg.includes("success") ? "text-green-400" : "text-blue-400"}`}>{msg}</p>}
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Display Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required maxLength={100}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1">Bio <span className="text-gray-600">({bio.length}/500)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={3}
                placeholder="Tell fans about yourself…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Avatar</label>
                <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300" />
              </div>
            </div>
          </div>

          {/* Tag + Plan */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-white font-bold">Producer Tag (Watermark)</h2>
              <p className="text-gray-500 text-xs leading-relaxed">Upload your vocal tag (.mp3 or .wav). It overlays every 8 seconds during beat previews so your tag is always heard.</p>
              {currentTagAudio && (
                <div className="space-y-1">
                  <p className="text-green-400 text-xs font-medium">✓ Tag active</p>
                  <audio src={currentTagAudio} controls className="w-full h-8" />
                </div>
              )}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">{currentTagAudio ? "Replace Tag Audio" : "Upload Tag Audio"}</label>
                <input type="file" accept="audio/*" onChange={e => setTagAudioFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300" />
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-white font-bold mb-3">Current Plan</h2>
              <div className="bg-gradient-to-br from-blue-600/40 to-blue-400/20 border border-blue-700/30 rounded-xl p-4">
                <p className="text-blue-400 font-bold text-lg capitalize">{userPlan ?? "Free"} Plan</p>
                {["Unlimited beat uploads","Priority marketplace placement","Advanced analytics","95% royalty rate"].map(f => (
                  <li key={f} className="text-gray-400 text-xs flex items-center gap-2 mt-2 list-none">
                    <svg className="w-3 h-3 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Social Links</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { key: "twitter",    label: "Twitter / X",  placeholder: "https://x.com/yourhandle" },
              { key: "instagram",  label: "Instagram",    placeholder: "https://instagram.com/yourhandle" },
              { key: "youtube",    label: "YouTube",      placeholder: "https://youtube.com/@yourchannel" },
              { key: "soundcloud", label: "SoundCloud",   placeholder: "https://soundcloud.com/yourprofile" },
              { key: "spotify",    label: "Spotify",      placeholder: "https://open.spotify.com/artist/..." },
              { key: "website",    label: "Website",      placeholder: "https://yourwebsite.com" },
            ] as { key: keyof typeof socialLinks; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-gray-400 text-xs font-medium block mb-1">{label}</label>
                <input value={socialLinks[key]} onChange={e => setSocialLinks(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Genre & Mood Specialties */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3">Genre Specialties</h2>
            <p className="text-gray-500 text-xs mb-3">Shown on your public producer profile.</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button type="button" key={g} onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedGenres.includes(g) ? "bg-blue-600/30 text-blue-300 border-blue-500" : "bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3">Mood Specialties</h2>
            <p className="text-gray-500 text-xs mb-3">Shown on your public producer profile.</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button type="button" key={m} onClick={() => toggleMood(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedMoods.includes(m) ? "bg-blue-600/30 text-blue-300 border-blue-500" : "bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 disabled:opacity-50 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </form>
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
  const [uploadTags, setUploadTags] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadPriceBasic, setUploadPriceBasic] = useState("29.99");
  const [uploadPricePremium, setUploadPricePremium] = useState("99.99");
  const [uploadPriceExclusive, setUploadPriceExclusive] = useState("299.99");
  const [aiDescriptions, setAiDescriptions] = useState<string[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);

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

  const [dragOverAudio, setDragOverAudio] = useState(false);
  const [dragOverArtwork, setDragOverArtwork] = useState(false);

  const [collabs, setCollabs] = useState<{ email: string; split: string; role: string }[]>([]);
  const [separatingStems, setSeparatingStems] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "beats" || activeTab === "analytics") {
      fetchMyBeats();
    }
    // Proactively wake the stem worker when the user opens the beats tab
    // so it's ready by the time they click "Separate Stems" (~30s cold start)
    if (activeTab === "beats") {
      fetch("/api/keep-alive").catch(() => {});
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
    if (!uploadTitle || !uploadGenre || !uploadBpm || !uploadKey) {
      setUploadError("Title, genre, BPM, and key are required.");
      return;
    }
    setUploading(true);
    try {
      let finalAudioUrl = "";

      if (uploadFile) {
        try {
          finalAudioUrl = await uploadAudioToHuggingFace(uploadFile, "beats");
        } catch (err: any) {
          setUploadError(`Audio upload failed: ${err.message}`);
          return;
        }
      }

      let finalArtworkUrl = "";
      if (editArtworkFile) {
        const ext = editArtworkFile.name.split(".").pop();
        const filePath = `artwork/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: artErr } = await supabase.storage.from("wavr-uploads").upload(filePath, editArtworkFile);
        if (!artErr) {
          const { data: { publicUrl } } = supabase.storage.from("wavr-uploads").getPublicUrl(filePath);
          finalArtworkUrl = publicUrl;
        }
      } else if (editArtworkPreview && editArtworkPreview.startsWith("http")) {
        finalArtworkUrl = editArtworkPreview;
      }

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
      if (uploadDescription.trim()) fd.append("description", uploadDescription.trim());
      
      // Send the Supabase URL instead of the raw file
      if (finalAudioUrl) fd.append("audioUrl", finalAudioUrl);
      if (finalArtworkUrl) fd.append("artworkUrl", finalArtworkUrl);

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
      setUploadMood(""); setUploadTags(""); setUploadFile(null); setUploadDescription("");
      setAiDescriptions([]);
      setUploadPriceBasic("29.99"); setUploadPricePremium("99.99"); setUploadPriceExclusive("299.99");
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
        const ext = editArtworkFile.name.split(".").pop();
        const filePath = `artworks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: artErr } = await supabase.storage.from("wavr-uploads").upload(filePath, editArtworkFile);
        if (artErr) {
          setEditError(`Artwork upload failed: ${artErr.message}`);
          setEditSaving(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("wavr-uploads").getPublicUrl(filePath);
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
                { label: "Total Earnings", value: producerStats ? `$${producerStats.stats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—", color: "text-blue-400" },
                { label: "Beats Sold", value: producerStats ? String(producerStats.stats.beatsSold) : "—", color: "text-blue-400" },
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
                              s.license === "Exclusive" ? "bg-blue-800/10 text-blue-400 border border-fuchsia-700/30" :
                              s.license === "Premium" ? "bg-blue-900/30 text-blue-400 border border-blue-700/30" :
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
                            <span className="text-blue-400 text-xs font-bold">${beat.revenue.toFixed(0)}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
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
                <button onClick={() => setShowUploadModal(true)} className="bg-blue-700 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
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
              <button onClick={() => setShowUploadModal(true)} className="bg-blue-700 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
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
                <button onClick={() => setShowUploadModal(true)} className="bg-blue-700 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  + Upload New Beat
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myBeatsData.map((beat) => (
                  <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-700/30 transition-all group">

                     {/* Artwork + Play Button */}
                     <div
                       className={`h-44 relative bg-gradient-to-br ${genreGradients[beat.genre] || "from-blue-600 via-gray-900 to-black"} ${beat.audioFile ? "cursor-pointer" : "cursor-default"}`}
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
                               ? "bg-blue-700 scale-110 shadow-blue-900/20"
                               : "bg-black/50 backdrop-blur-sm group-hover:bg-blue-900/30 group-hover:scale-110"
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
                            <p className="text-blue-400 text-xs font-bold">${beat.revenue.toFixed(0)}</p>
                            <p className="text-gray-500 text-xs">Revenue</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                           <button onClick={() => openEditModal(beat)} className="flex-1 bg-blue-900/30 hover:bg-blue-900/30 text-blue-400 text-[10px] font-bold py-2 rounded-lg transition-colors border border-blue-700/30">Edit</button>
                           <button onClick={() => deleteBeat(beat.id)} className="flex-1 bg-blue-900/30 hover:bg-blue-900/30 text-blue-400 text-[10px] font-bold py-2 rounded-lg transition-colors border border-red-800/30">Delete</button>
                          {beat.audioFile && (
                            <button
                              disabled={separatingStems[beat.id] || beat.stems?.some(s => s.status === "processing")}
                              onClick={async () => {
                                setSeparatingStems(prev => ({ ...prev, [beat.id]: true }));
                                try {
                                  const res = await fetch(`/api/beats/${beat.id}/stems`, { method: "POST" });
                                  const d = await res.json().catch(() => ({}));
                                  if (!res.ok || d.ok === false) {
                                    alert(d.error || "Stem separation failed. Check that the worker is running.");
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

                        {/* Stems download panel */}
                        {beat.stems?.some(s => s.status === "ready" && s.filePath) && (() => {
                          const safeName = beat.title.replace(/[/\\?%*:|"<>]/g, "-");
                          const folderName = `${safeName} — ${beat.bpm}BPM ${beat.key}`;
                          const stemLabels: Record<string, string> = { drums: "Drums", bass: "Bass", melody: "Melody", other: "Other" };
                          return (
                            <div className="mt-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-2">📁 {folderName}</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {beat.stems!.filter(s => s.status === "ready" && s.filePath).map(stem => {
                                  const label = stemLabels[stem.type] ?? stem.type;
                                  const filename = `${safeName} - ${label}.wav`;
                                  const proxyUrl = `/api/audio?url=${encodeURIComponent(stem.filePath!)}&filename=${encodeURIComponent(filename)}`;
                                  return (
                                    <a
                                      key={stem.type}
                                      href={proxyUrl}
                                      download={filename}
                                      className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-700/60 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors text-[10px] font-medium"
                                    >
                                      <svg className="w-3 h-3 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      {label}.wav
                                    </a>
                                  );
                                })}
                              </div>
                              <p className="text-gray-600 text-[9px] mt-2">Files download with beat name, BPM & key</p>
                            </div>
                          );
                        })()}
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
                  <p className="text-3xl font-black text-blue-400">{s.value}</p>
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
                    { type: "Premium", amount: eb.premium, pct: Math.round((eb.premium / total) * 100), color: "bg-blue-700" },
                    { type: "Exclusive", amount: eb.exclusive, pct: Math.round((eb.exclusive / total) * 100), color: "bg-blue-700" },
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
                    { label: "Basic", amount: et.basic, color: "bg-blue-700" },
                    { label: "Premium", amount: et.premium, color: "bg-blue-700" },
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
                          className="flex-1 bg-blue-900/30 hover:bg-blue-900/30 rounded-sm transition-colors"
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
                        <span className="text-blue-400 font-bold text-sm">${b.revenue.toFixed(0)}</span>
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
                            l.type === "Exclusive" ? "bg-blue-800/10 text-blue-400 border border-fuchsia-700/30" :
                            l.type === "Premium" ? "bg-blue-900/30 text-blue-400 border border-blue-700/30" :
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

        {/* Sound Kits Tab */}
        {activeTab === "kits" && (
          <SoundKitsTab userId={user?.id} />
        )}

        {/* Collections Tab */}
        {activeTab === "collections" && (
          <CollectionsTab userId={user?.id} />
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
                  className="bg-blue-900/30 hover:bg-blue-900/30 text-blue-400 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded border border-blue-700/30 flex items-center gap-1 transition-all"
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
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Genre *</label>
                  <select value={editGenre} onChange={e => setEditGenre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Select genre</option>
                    {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Mood</label>
                  <select value={editMood} onChange={e => setEditMood(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Select mood</option>
                    {["Dark","Chill","Energetic","Aggressive","Happy","Melancholic","Motivated","Romantic"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">BPM *</label>
                  <input value={editBpm} onChange={e => setEditBpm(e.target.value)} type="number" min="40" max="250" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Key *</label>
                  <input value={editKey} onChange={e => setEditKey(e.target.value)} placeholder="e.g. F# Minor" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                    <option value="active">Active (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="dark, heavy, melodic" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
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
                        <input value={value} onChange={e => set(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Artwork Upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Artwork</label>
                <div
                  className={`relative w-full h-36 rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden bg-gray-800/50 group ${dragOverArtwork ? "border-blue-500 bg-blue-900/10" : "border-gray-700 hover:border-blue-600"}`}
                  onClick={() => editArtworkRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOverArtwork(true); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverArtwork(true); }}
                  onDragLeave={() => setDragOverArtwork(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverArtwork(false);
                    const file = e.dataTransfer.files[0];
                    if (file) { setEditArtworkFile(file); setEditArtworkPreview(URL.createObjectURL(file)); }
                  }}
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
                      <span className="text-gray-500 text-xs">Drop image or click to browse</span>
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
                      className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArtwork}
                      disabled={generatingArtwork || !artworkPrompt}
                      className="px-4 py-2 bg-blue-900/30 hover:bg-blue-900/30 border border-blue-700/30 text-blue-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingArtwork ? (
                        <>
                          <div className="w-3 h-3 border-2 border-blue-700/30 border-t-purple-400 rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>✨ Generate</>
                      )}
                    </button>
                  </div>
                  {artworkError && <p className="text-blue-400 text-[10px]">{artworkError}</p>}
                </div>

                {editArtworkFile && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400 text-xs truncate max-w-[200px]">{editArtworkFile.name}</span>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-blue-400 text-xs transition-colors"
                      onClick={() => { setEditArtworkFile(null); setEditArtworkPreview(editBeat?.artwork ?? null); }}
                    >✕ Remove</button>
                  </div>
                )}
              </div>

              {editError && <p className="text-blue-400 text-xs bg-blue-900/30 border border-red-800/40 rounded-lg px-3 py-2">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditBeat(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 bg-blue-700 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
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
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragOverAudio ? "border-blue-500 bg-blue-900/10" : "border-gray-700 hover:border-blue-600"}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOverAudio(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragOverAudio(true); }}
                onDragLeave={() => setDragOverAudio(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverAudio(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setUploadFile(file);
                }}
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
                  <p className="text-blue-400 text-sm font-medium">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Drop audio file or click to browse</p>
                    <p className="text-gray-600 text-xs mt-1">MP3, WAV, FLAC up to 500MB</p>
                  </>
                )}
              </div>

              {/* Required fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Beat Title *</label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Enter beat title" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Genre *</label>
                  <select value={uploadGenre} onChange={e => setUploadGenre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Select genre</option>
                    {["Trap","Hip-Hop","R&B","Drill","Pop","Afrobeats","Lo-Fi","House","Other"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Mood</label>
                  <select value={uploadMood} onChange={e => setUploadMood(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Select mood</option>
                    {["Dark","Chill","Energetic","Aggressive","Happy","Melancholic","Motivated","Romantic"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">BPM *</label>
                  <input value={uploadBpm} onChange={e => setUploadBpm(e.target.value)} type="number" min="40" max="250" placeholder="140" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Key *</label>
                  <input value={uploadKey} onChange={e => setUploadKey(e.target.value)} placeholder="e.g. F# Minor" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600" />
                </div>

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
                        // Upload directly from browser to HuggingFace, then send URL to analyze API
                        const hfUrl = await uploadAudioToHuggingFace(uploadFile, "temp-analyze");
                        const res = await fetch("/api/beats/analyze", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ audioUrl: hfUrl, originalFileName: uploadFile.name }),
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
                  {detectError && <p className="text-blue-400 text-xs mt-1.5">{detectError}</p>}
                </div>

                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1">Tags <span className="text-gray-600">(comma separated)</span></label>
                  <input value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="dark, heavy, melodic" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600" />
                </div>

                {/* Description + AI Suggest */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-400 text-xs font-medium">Description</label>
                    <button
                      type="button"
                      disabled={generatingDesc || !uploadGenre || !uploadBpm}
                      onClick={async () => {
                        setGeneratingDesc(true);
                        try {
                          const tags = uploadTags ? uploadTags.split(",").map(t => t.trim()).filter(Boolean) : [];
                          const res = await fetch("/api/ai/describe-beat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: uploadTitle, genre: uploadGenre, bpm: uploadBpm, key: uploadKey, mood: uploadMood, tags }),
                          });
                          const data = await res.json();
                          if (data.suggestions) { setAiDescriptions(data.suggestions); setUploadDescription(data.suggestions[0]); }
                        } catch {} finally { setGeneratingDesc(false); }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-700/30 text-blue-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {generatingDesc ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      AI Suggest
                    </button>
                  </div>
                  <textarea
                    value={uploadDescription}
                    onChange={e => setUploadDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe your beat — vibe, influences, best use cases, sync notes…"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600 resize-none"
                  />
                  {aiDescriptions.length > 1 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {aiDescriptions.map((s, i) => (
                        <button key={i} type="button" onClick={() => setUploadDescription(s)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${uploadDescription === s ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}`}>
                          Option {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  {!uploadGenre || !uploadBpm ? <p className="text-gray-600 text-xs mt-1">Fill in genre and BPM first to unlock AI suggestions.</p> : null}
                </div>
              </div>

              {/* Artwork Upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Artwork</label>
                <div
                  className={`relative w-full h-36 rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden bg-gray-800/50 group ${dragOverArtwork ? "border-blue-500 bg-blue-900/10" : "border-gray-700 hover:border-blue-600"}`}
                  onClick={() => editArtworkRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOverArtwork(true); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverArtwork(true); }}
                  onDragLeave={() => setDragOverArtwork(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverArtwork(false);
                    const file = e.dataTransfer.files[0];
                    if (file) { setEditArtworkFile(file); setEditArtworkPreview(URL.createObjectURL(file)); }
                  }}
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
                      <span className="text-gray-500 text-xs">Drop image or click to browse</span>
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
                      className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateArtwork}
                      disabled={generatingArtwork || !artworkPrompt}
                      className="px-4 py-2 bg-blue-900/30 hover:bg-blue-900/30 border border-blue-700/30 text-blue-400 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingArtwork ? (
                        <>
                          <div className="w-3 h-3 border-2 border-blue-700/30 border-t-purple-400 rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>✨ Generate</>
                      )}
                    </button>
                  </div>
                  {artworkError && <p className="text-blue-400 text-[10px]">{artworkError}</p>}
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
                        <input value={value} onChange={e => set(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600" />
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
                    className="text-xs text-blue-400 hover:text-blue-400"
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
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-600"
                        />
                        <div className="relative w-20">
                          <input
                            type="number" min="1" max="99" value={c.split}
                            onChange={(e) => setCollabs(prev => prev.map((x, j) => j === i ? { ...x, split: e.target.value } : x))}
                            placeholder="%"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-600 pr-6"
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
                        <button type="button" onClick={() => setCollabs(prev => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-blue-400 text-xs">✕</button>
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
                <p className="text-blue-400 text-xs bg-blue-900/30 border border-red-800/40 rounded-lg px-3 py-2">{uploadError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold py-2.5 rounded-xl transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 bg-blue-700 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
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

