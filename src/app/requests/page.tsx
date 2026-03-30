"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BeatRequest {
  id: string;
  artistName: string;
  title: string;
  description: string;
  genre: string | null;
  bpm: string | null;
  mood: string | null;
  budget: number;
  deadline: string | null;
  status: string;
  bidCount: number;
  createdAt: string;
}

const GENRES = ["All", "Trap", "Hip-Hop", "R&B", "Drill", "Pop", "Afrobeats", "Lo-Fi", "Jazz", "Other"];

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("All");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reqGenre, setReqGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = genre !== "All" ? `/api/requests?genre=${encodeURIComponent(genre)}` : "/api/requests";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, genre: reqGenre, bpm, mood, budget: parseFloat(budget), deadline: deadline || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        setFormError(data.error ?? "Failed to post request");
        return;
      }
      setRequests((prev) => [{ ...data, artistName: "You", bidCount: 0 }, ...prev]);
      setTitle(""); setDescription(""); setReqGenre(""); setBpm(""); setMood(""); setBudget(""); setDeadline("");
      setShowForm(false);
    } catch { setFormError("Network error."); }
    finally { setSubmitting(false); }
  }

  const daysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return d > 0 ? d : 0;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/30 via-gray-900 to-gray-900 border-b border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Beat Requests</h1>
              <p className="text-gray-400 text-lg">Artists post what they need. Producers bid. Best beat wins.</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl"
            >
              + Post a Request
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { emoji: "📝", title: "Artist Posts Brief", desc: "Describe what you need: genre, BPM, mood, and your budget." },
            { emoji: "🎤", title: "Producers Bid", desc: "Producers submit demo previews and prices. You choose the best." },
            { emoji: "💰", title: "Winner Gets Paid", desc: "Accept a bid, pay securely, and own the beat exclusively." },
          ].map((s) => (
            <div key={s.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <p className="text-white font-semibold text-sm">{s.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Post request form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">Post a Beat Request</h2>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Request Title *</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  required placeholder='e.g. "Dark trap beat for my mixtape"'
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Budget ($) *</label>
                <input
                  type="number" min="10" step="1" value={budget}
                  onChange={(e) => setBudget(e.target.value)} required
                  placeholder="e.g. 200"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Description *</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                required rows={3}
                placeholder="Describe the vibe, reference artists, what the beat is for..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Genre</label>
                <select
                  value={reqGenre} onChange={(e) => setReqGenre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">Any</option>
                  {GENRES.slice(1).map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">BPM Range</label>
                <input
                  value={bpm} onChange={(e) => setBpm(e.target.value)}
                  placeholder="e.g. 140-150"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Mood</label>
                <input
                  value={mood} onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. dark, energetic"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Deadline</label>
                <input
                  type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit" disabled={submitting}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
              >{submitting ? "Posting…" : "Post Request"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-sm px-4">Cancel</button>
            </div>
          </form>
        )}

        {/* Genre filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                genre === g
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
              }`}
            >{g}</button>
          ))}
          {!loading && <span className="text-gray-600 text-sm ml-2">{requests.length} open requests</span>}
        </div>

        {/* Requests list */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <p className="text-gray-500 text-lg">No open requests right now.</p>
            <p className="text-gray-600 text-sm mt-2">Be the first to post one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const days = daysLeft(r.deadline);
              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/requests/${r.id}`)}
                  className="bg-gray-900 border border-gray-800 hover:border-violet-700/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-violet-900/20 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-white font-bold group-hover:text-violet-300 transition-colors">{r.title}</h3>
                        {r.genre && (
                          <span className="text-xs bg-violet-900/40 text-violet-300 border border-violet-700/30 px-2 py-0.5 rounded-full">{r.genre}</span>
                        )}
                        {r.mood && (
                          <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">{r.mood}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{r.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>By {r.artistName}</span>
                        {r.bpm && <span>BPM: {r.bpm}</span>}
                        <span>{r.bidCount} bid{r.bidCount !== 1 ? "s" : ""}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        {days !== null && (
                          <span className={days <= 2 ? "text-red-400" : "text-gray-500"}>
                            {days === 0 ? "Deadline today!" : `${days}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-white">${r.budget.toFixed(0)}</p>
                      <p className="text-gray-500 text-xs mt-0.5">budget</p>
                      <button className="mt-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">
                        Submit Bid →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
