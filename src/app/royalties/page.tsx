"use client";

import { useState, useEffect } from "react";

interface RoyaltyReport {
  id: string;
  platform: string;
  trackTitle: string;
  streams: number;
  revenue: number;
  reportedAt: string;
}

interface LicenseWithReports {
  licenseId: string;
  beatId: string;
  beatTitle: string;
  producerName: string;
  licenseType: string;
  purchasedAt: string;
  reports: RoyaltyReport[];
}

const PLATFORMS = ["Spotify", "Apple Music", "YouTube", "SoundCloud", "Tidal", "Amazon Music", "Audiomack", "Other"];

export default function RoyaltiesPage() {
  const [licenses, setLicenses] = useState<LicenseWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<string>("");
  const [platform, setPlatform] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [streams, setStreams] = useState("");
  const [revenue, setRevenue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/royalties")
      .then((r) => r.json())
      .then((d) => setLicenses(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStreams = licenses.flatMap((l) => l.reports).reduce((s, r) => s + r.streams, 0);
  const totalRevenue = licenses.flatMap((l) => l.reports).reduce((s, r) => s + r.revenue, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/royalties/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId: selectedLicense,
          platform,
          trackTitle,
          trackUrl: trackUrl || null,
          streams: parseInt(streams, 10) || 0,
          revenue: parseFloat(revenue) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }

      const newReport: RoyaltyReport = {
        id: data.id,
        platform,
        trackTitle,
        streams: parseInt(streams, 10) || 0,
        revenue: parseFloat(revenue) || 0,
        reportedAt: data.reportedAt,
      };
      setLicenses((prev) => prev.map((l) =>
        l.licenseId === selectedLicense ? { ...l, reports: [newReport, ...l.reports] } : l
      ));
      setSuccess("Report submitted! The producer has been notified.");
      setPlatform(""); setTrackTitle(""); setTrackUrl(""); setStreams(""); setRevenue(""); setSelectedLicense(""); setShowForm(false);
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-r from-green-900/30 via-gray-900 to-gray-900 border-b border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-2">Royalty Dashboard</h1>
          <p className="text-gray-400">Report your streams to producers. Be transparent about how their beats perform.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Totals */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Licensed Beats", value: licenses.length.toString(), color: "text-purple-400" },
            { label: "Total Streams Reported", value: totalStreams.toLocaleString(), color: "text-blue-400" },
            { label: "Total Revenue Reported", value: `$${totalRevenue.toFixed(2)}`, color: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-500 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {success && <div className="bg-green-900/20 border border-green-700/30 text-green-400 rounded-xl px-5 py-3 text-sm">{success}</div>}

        {/* Report button */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Your Licensed Beats</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >+ Submit Royalty Report</button>
        </div>

        {/* Report form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold">Submit Royalty Report</h3>
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Beat License *</label>
              <select
                value={selectedLicense} onChange={(e) => setSelectedLicense(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              >
                <option value="">Select a licensed beat…</option>
                {licenses.map((l) => (
                  <option key={l.licenseId} value={l.licenseId}>
                    {l.beatTitle} ({l.licenseType}) by {l.producerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Platform *</label>
                <select
                  value={platform} onChange={(e) => setPlatform(e.target.value)} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Select platform…</option>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Track / Song Title *</label>
                <input
                  value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} required
                  placeholder='e.g. "Midnight Moves"'
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Track URL</label>
              <input
                type="url" value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Total Streams</label>
                <input
                  type="number" min="0" value={streams} onChange={(e) => setStreams(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Reported Revenue ($)</label>
                <input
                  type="number" min="0" step="0.01" value={revenue} onChange={(e) => setRevenue(e.target.value)}
                  placeholder="e.g. 120.50"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <p className="text-gray-600 text-xs">Revenue and streams are self-reported and used for transparency with producers. You can submit multiple reports over time as your track grows.</p>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-sm px-4">Cancel</button>
            </div>
          </form>
        )}

        {/* License list with reports */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : licenses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-gray-500">No licensed beats yet.</p>
            <p className="text-gray-600 text-sm mt-1">License a beat from the marketplace to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {licenses.map((l) => (
              <div key={l.licenseId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                  <div>
                    <h3 className="text-white font-bold">{l.beatTitle}</h3>
                    <p className="text-gray-500 text-xs">by {l.producerName} · {l.licenseType} license · {new Date(l.purchasedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{l.reports.reduce((s, r) => s + r.streams, 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">streams reported</p>
                  </div>
                </div>
                {l.reports.length === 0 ? (
                  <p className="text-gray-600 text-sm p-4">No reports yet for this beat.</p>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {l.reports.map((r) => (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-lg">{
                          r.platform === "Spotify" ? "🟢" :
                          r.platform === "Apple Music" ? "🍎" :
                          r.platform === "YouTube" ? "🔴" :
                          r.platform === "SoundCloud" ? "🟠" : "🎵"
                        }</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-sm font-medium truncate">{r.trackTitle}</p>
                          <p className="text-gray-500 text-xs">{r.platform} · {new Date(r.reportedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white text-sm font-semibold">{r.streams.toLocaleString()} streams</p>
                          {r.revenue > 0 && <p className="text-green-400 text-xs">${r.revenue.toFixed(2)} reported</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
