"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Bid {
  id: string;
  producerName: string;
  producerId: string;
  message: string;
  audioDemo: string | null;
  price: number;
  status: string;
  createdAt: string;
}

interface BeatRequest {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  genre: string | null;
  bpm: string | null;
  mood: string | null;
  budget: number;
  deadline: string | null;
  status: string;
  createdAt: string;
  bids: Bid[];
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<BeatRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Bid form
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then(setRequest)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = user?.id === request?.artistId;
  const alreadyBid = request?.bids.some((b) => b.producerId === user?.id);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    setBidError(""); setSubmitting(true);
    try {
      const form = new FormData();
      form.append("message", message);
      form.append("price", price);
      if (demoFile) form.append("demo", demoFile);

      const res = await fetch(`/api/requests/${id}/bids`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        setBidError(data.error ?? "Failed to submit bid");
        return;
      }
      setRequest((prev) => prev ? {
        ...prev,
        bids: [{ ...data, producerName: user?.name ?? "You", producerId: user?.id ?? "" }, ...prev.bids],
      } : prev);
      setMessage(""); setPrice(""); setDemoFile(null);
    } catch { setBidError("Network error."); }
    finally { setSubmitting(false); }
  }

  async function handleAccept(bidId: string) {
    setAccepting(bidId);
    try {
      const res = await fetch(`/api/requests/${id}/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed"); return; }
      window.location.href = data.url;
    } catch { alert("Network error."); }
    finally { setAccepting(null); }
  }

  async function handleReject(bidId: string) {
    const res = await fetch(`/api/requests/${id}/bids/${bidId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (res.ok) {
      setRequest((prev) => prev ? {
        ...prev,
        bids: prev.bids.map((b) => b.id === bidId ? { ...b, status: "rejected" } : b),
      } : prev);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-32 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!request) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Request not found.</div>;
  }

  const STATUS_COLORS: Record<string, string> = {
    open: "text-green-400 bg-green-900/20 border-green-700/30",
    closed: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30",
    completed: "text-blue-400 bg-blue-900/20 border-blue-700/30",
    cancelled: "text-gray-400 bg-gray-800 border-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Back */}
        <button onClick={() => router.push("/requests")} className="text-gray-500 hover:text-white text-sm flex items-center gap-1">
          ← Back to Requests
        </button>

        {/* Request card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">{request.title}</h1>
              <p className="text-gray-500 text-sm">By {request.artistName} · {new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border capitalize shrink-0 ${STATUS_COLORS[request.status] ?? ""}`}>
              {request.status}
            </span>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-4">{request.description}</p>

          <div className="flex flex-wrap gap-3 mb-4">
            {request.genre && <Tag label="Genre" value={request.genre} />}
            {request.bpm && <Tag label="BPM" value={request.bpm} />}
            {request.mood && <Tag label="Mood" value={request.mood} />}
            {request.deadline && <Tag label="Deadline" value={new Date(request.deadline).toLocaleDateString()} />}
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            <p className="text-gray-400 text-sm">{request.bids.length} bid{request.bids.length !== 1 ? "s" : ""} submitted</p>
            <p className="text-3xl font-black text-white">${request.budget.toFixed(0)} <span className="text-gray-500 text-sm font-normal">budget</span></p>
          </div>
        </div>

        {/* Bids list */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Bids ({request.bids.length})</h2>
          {request.bids.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-500">No bids yet. Be the first producer to submit!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {request.bids.map((bid) => (
                <div key={bid.id} className={`bg-gray-900 border rounded-2xl p-5 ${
                  bid.status === "accepted" ? "border-green-700/50" : bid.status === "rejected" ? "border-gray-700 opacity-60" : "border-gray-800"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-fuchsia-800 flex items-center justify-center text-white text-xs font-bold">
                          {bid.producerName.charAt(0)}
                        </div>
                        <p className="text-white font-semibold text-sm">{bid.producerName}</p>
                        {bid.status !== "pending" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            bid.status === "accepted" ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"
                          }`}>{bid.status}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{bid.message}</p>
                      {bid.audioDemo && (
                        <div className="mb-3">
                          <p className="text-gray-500 text-xs mb-1">Demo Preview</p>
                          <audio controls src={bid.audioDemo} className="w-full h-8" style={{ filter: "invert(0.9) hue-rotate(270deg)" }} />
                        </div>
                      )}
                      <p className="text-gray-600 text-xs">{new Date(bid.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-white">${bid.price.toFixed(0)}</p>
                      {isOwner && bid.status === "pending" && request.status === "open" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAccept(bid.id)}
                            disabled={accepting === bid.id}
                            className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg"
                          >{accepting === bid.id ? "…" : "Accept & Pay"}</button>
                          <button
                            onClick={() => handleReject(bid.id)}
                            className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-3 py-1.5 rounded-lg"
                          >Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit bid form */}
        {!isOwner && !alreadyBid && request.status === "open" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Submit Your Bid</h2>
            {bidError && <p className="text-red-400 text-sm mb-3">{bidError}</p>}
            <form onSubmit={handleBid} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Your Pitch *</label>
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  required rows={3}
                  placeholder="Describe your beat, your style, why it fits this request..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Your Price ($) *</label>
                  <input
                    type="number" min="1" step="1" value={price}
                    onChange={(e) => setPrice(e.target.value)} required
                    placeholder={`Budget: $${request.budget.toFixed(0)}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Demo Audio (optional)</label>
                  <input
                    type="file" accept="audio/*"
                    onChange={(e) => setDemoFile(e.target.files?.[0] ?? null)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-400 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={submitting}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl"
              >{submitting ? "Submitting…" : "Submit Bid"}</button>
            </form>
          </div>
        )}

        {alreadyBid && (
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 text-center text-violet-300 text-sm">
            You already submitted a bid on this request.
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
      <p className="text-gray-600 text-xs">{label}</p>
      <p className="text-gray-300 text-sm font-medium">{value}</p>
    </div>
  );
}
