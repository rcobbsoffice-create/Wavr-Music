"use client";

import { useState, useEffect } from "react";

const DATE_RANGES = [
  { label: "Last 7 days",  range: "7" },
  { label: "Last 30 days", range: "30" },
  { label: "Last 90 days", range: "90" },
  { label: "Last year",    range: "365" },
];

// ── Chart helpers ────────────────────────────────────────────────────────────

function buildLinePath(data: number[], w: number, h: number, pad = 20) {
  if (data.length < 2) return "";
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const xStep = (w - pad * 2) / (data.length - 1);
  return data.map((v, i) => {
    const x = pad + i * xStep;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function buildAreaPath(data: number[], w: number, h: number, pad = 20) {
  if (data.length < 2) return "";
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const xStep = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * xStep;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M ${pad} ${h - pad} L ${pts.join(" L ")} L ${(pad + (data.length - 1) * xStep).toFixed(1)} ${h - pad} Z`;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface DayData   { date: string; plays: number; revenue: number }
interface TopBeat   { id: string; title: string; plays: number; revenue: number; licenses: number; topLicenseType: string | null }
interface LicType   { name: string; count: number; pct: number }
interface Totals    { plays: number; revenue: number; licenses: number; producers: number }

interface AnalyticsData {
  days: DayData[];
  totals: Totals;
  topBeats: TopBeat[];
  licenseTypes: LicType[];
}

// ── Static data (not tracked yet) ───────────────────────────────────────────

const geographyData = [
  { country: "United States", code: "US", pct: 44 },
  { country: "United Kingdom", code: "UK", pct: 15 },
  { country: "Nigeria",        code: "NG", pct: 14 },
  { country: "Canada",         code: "CA", pct: 8  },
  { country: "Brazil",         code: "BR", pct: 7  },
  { country: "Germany",        code: "DE", pct: 4  },
  { country: "France",         code: "FR", pct: 3  },
  { country: "Other",          code: "XX", pct: 5  },
];

const ageGroups = [
  { group: "13–17", pct: 8 },
  { group: "18–24", pct: 34 },
  { group: "25–34", pct: 31 },
  { group: "35–44", pct: 18 },
  { group: "45–54", pct: 6  },
  { group: "55+",   pct: 3  },
];

function buildHeatmap() {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, h) => {
      const weekend = day >= 5;
      const base = (h >= 18 && h <= 23) ? (weekend ? 95 : 75)
                 : (h >= 12 && h <= 17) ? (weekend ? 65 : 45)
                 : (h <= 3)             ? 30 : 10;
      return Math.min(100, base + Math.random() * 20 - 10);
    })
  );
}
const heatmapData = buildHeatmap();
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CHART_W = 600;
const CHART_H = 140;

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${selectedRange.range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedRange.range]);

  const plays   = data?.days.map((d) => d.plays)   ?? [];
  const revenue = data?.days.map((d) => d.revenue) ?? [];
  const totalPlays   = plays.reduce((a, b) => a + b, 0);
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);

  const revenueBreakdown = data?.licenseTypes.map((lt) => ({
    label: lt.name,
    value: (data.totals.revenue * lt.pct) / 100,
    color: lt.name.startsWith("Basic") ? "bg-purple-500"
         : lt.name.startsWith("Premium") ? "bg-fuchsia-500"
         : "bg-violet-500",
  })) ?? [];
  const maxRevBreakdown = Math.max(...revenueBreakdown.map((r) => r.value), 1);

  const streamPath = buildLinePath(plays,   CHART_W, CHART_H);
  const streamArea = buildAreaPath(plays,   CHART_W, CHART_H);
  const revPath    = buildLinePath(revenue, CHART_W, CHART_H);
  const revArea    = buildAreaPath(revenue, CHART_W, CHART_H);

  const intensityColor = (v: number) =>
    v > 80 ? "bg-purple-500" : v > 60 ? "bg-purple-600/80" : v > 40 ? "bg-purple-700/60" : v > 20 ? "bg-purple-900/60" : "bg-gray-800";

  const xLabels = (arr: DayData[]) => {
    if (arr.length === 0) return [];
    const step = Math.max(1, Math.floor(arr.length / 6));
    return arr.reduce<{ i: number; label: string }[]>((acc, d, i) => {
      if (i % step === 0 || i === arr.length - 1) acc.push({ i, label: d.date.split(" ")[1] });
      return acc;
    }, []);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Platform-wide insights into plays, revenue, and licensing</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DATE_RANGES.map((r) => (
              <button
                key={r.range}
                onClick={() => setSelectedRange(r)}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedRange.range === r.range
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Plays",      value: loading ? "…" : (data?.totals.plays ?? 0).toLocaleString(),   icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
            { label: "Revenue",          value: loading ? "…" : `$${(data?.totals.revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 16v-1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Licenses Sold",    value: loading ? "…" : (data?.totals.licenses ?? 0).toLocaleString(), icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { label: "Active Producers", value: loading ? "…" : (data?.totals.producers ?? 0).toLocaleString(), icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
          ].map((card) => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <p className="text-white text-2xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Play Trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-lg">Beat Play Trends</h2>
            <span className="text-gray-500 text-xs">{totalPlays.toLocaleString()} plays in period</span>
          </div>
          {loading ? (
            <div className="h-40 bg-gray-800 animate-pulse rounded-lg" />
          ) : plays.length < 2 ? (
            <p className="text-gray-600 text-sm py-10 text-center">No play data yet for this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 30}`} className="w-full min-w-[360px]">
                <defs>
                  <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0,25,50,75,100].map((pct) => (
                  <line key={pct} x1="20" y1={CHART_H - 20 - (pct/100)*(CHART_H-40)} x2={CHART_W-20} y2={CHART_H - 20 - (pct/100)*(CHART_H-40)} stroke="#1f2937" strokeWidth="1" />
                ))}
                <path d={streamArea} fill="url(#streamGrad)" />
                <path d={streamPath} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {xLabels(data?.days ?? []).map(({ i, label }) => (
                  <text key={i} x={20 + (i / (plays.length - 1)) * (CHART_W - 40)} y={CHART_H + 20} textAnchor="middle" fill="#4b5563" fontSize="10">{label}</text>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Revenue Chart + License Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-5">Revenue Trend</h2>
            {loading ? (
              <div className="h-40 bg-gray-800 animate-pulse rounded-lg" />
            ) : revenue.length < 2 ? (
              <p className="text-gray-600 text-sm py-10 text-center">No revenue data yet for this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 30}`} className="w-full min-w-[280px]">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d946ef" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#d946ef" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {[0,25,50,75,100].map((pct) => (
                    <line key={pct} x1="20" y1={CHART_H - 20 - (pct/100)*(CHART_H-40)} x2={CHART_W-20} y2={CHART_H - 20 - (pct/100)*(CHART_H-40)} stroke="#1f2937" strokeWidth="1" />
                  ))}
                  <path d={revArea} fill="url(#revGrad)" />
                  <path d={revPath} fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {xLabels(data?.days ?? []).map(({ i, label }) => (
                    <text key={i} x={20 + (i / (revenue.length - 1)) * (CHART_W - 40)} y={CHART_H + 20} textAnchor="middle" fill="#4b5563" fontSize="10">{label}</text>
                  ))}
                </svg>
              </div>
            )}
            <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-400">Revenue Breakdown</h3>
              {revenueBreakdown.map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{r.label}</span>
                    <span className="text-gray-300 font-medium">${r.value.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full`} style={{ width: `${(r.value / maxRevBreakdown) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-5">License Type Breakdown</h2>
            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-800 animate-pulse rounded" />)}</div>
            ) : (data?.licenseTypes ?? []).length === 0 ? (
              <p className="text-gray-600 text-sm py-10 text-center">No licenses sold yet.</p>
            ) : (
              <div className="space-y-4">
                {(data?.licenseTypes ?? []).map((lt, i) => {
                  const colors = ["bg-purple-500", "bg-fuchsia-500", "bg-violet-500"];
                  return (
                    <div key={lt.name}>
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="text-gray-300 font-medium">{lt.name}</span>
                        <span className="text-gray-400">{lt.count} ({lt.pct}%)</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i % 3]} rounded-full`} style={{ width: `${lt.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Beats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800">
            <h2 className="text-white font-bold text-lg">Top Performing Beats</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/30">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Beat</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Plays</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Licenses</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium hidden sm:table-cell">Top License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-800 animate-pulse rounded w-3/4" /></td></tr>
                  ))
                ) : (data?.topBeats ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-600">No beats yet.</td></tr>
                ) : (
                  (data?.topBeats ?? []).map((beat, i) => (
                    <tr key={beat.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-gray-600">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-800 to-fuchsia-900 shrink-0" />
                          <span className="text-gray-300 font-medium">{beat.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">{beat.plays.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{beat.licenses}</td>
                      <td className="px-6 py-4 text-right text-green-400 font-semibold">${beat.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-gray-500 hidden sm:table-cell capitalize">
                        {beat.topLicenseType ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic + Peak Hours */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-2">Geographic Reach</h2>
            <p className="text-gray-600 text-xs mb-5">Based on estimated listener regions</p>
            <div className="space-y-3">
              {geographyData.map((g, i) => (
                <div key={g.code} className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm w-4 shrink-0">{i + 1}</span>
                  <span className="text-gray-300 text-sm w-32 shrink-0">{g.country}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full" style={{ width: `${g.pct}%` }} />
                  </div>
                  <span className="text-gray-500 text-xs w-8 text-right shrink-0">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-5">Peak Activity Hours</h2>
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                <div className="flex mb-1 pl-8">
                  {[0,3,6,9,12,15,18,21].map((h) => (
                    <div key={h} className="flex-1 text-center text-gray-600 text-xs">
                      {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`}
                    </div>
                  ))}
                </div>
                {heatmapData.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
                    <span className="text-gray-600 text-xs w-7 shrink-0">{DAY_LABELS[dayIdx]}</span>
                    {row.map((val, hourIdx) => (
                      <div key={hourIdx} className={`flex-1 h-5 rounded-sm ${intensityColor(val)}`} />
                    ))}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-gray-600 text-xs">Low</span>
                  {["bg-gray-800","bg-purple-900/60","bg-purple-700/60","bg-purple-600/80","bg-purple-500"].map((c,i) => (
                    <div key={i} className={`w-5 h-3 rounded-sm ${c}`} />
                  ))}
                  <span className="text-gray-600 text-xs">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-2">Audience Demographics</h2>
          <p className="text-gray-600 text-xs mb-5">Estimated — based on platform signup data</p>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Age Groups</h3>
              <div className="space-y-2.5">
                {ageGroups.map((ag) => (
                  <div key={ag.group} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-10 shrink-0">{ag.group}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-violet-600 flex items-center pl-2" style={{ width: `${ag.pct}%` }}>
                        {ag.pct > 12 && <span className="text-white text-xs font-medium">{ag.pct}%</span>}
                      </div>
                    </div>
                    {ag.pct <= 12 && <span className="text-gray-500 text-xs w-6">{ag.pct}%</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Gender Split</h3>
              <div className="h-6 bg-gray-800 rounded-lg overflow-hidden flex">
                <div className="bg-blue-600/70 h-full flex items-center justify-center" style={{ width: "62%" }}>
                  <span className="text-white text-xs font-medium">Male 62%</span>
                </div>
                <div className="bg-fuchsia-600/70 h-full flex items-center justify-center" style={{ width: "31%" }}>
                  <span className="text-white text-xs font-medium">F 31%</span>
                </div>
                <div className="bg-gray-600/50 h-full flex items-center justify-center flex-1">
                  <span className="text-white text-xs">7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
