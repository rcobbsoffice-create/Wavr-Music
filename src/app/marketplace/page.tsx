"use client";

import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { Beat } from "@/lib/mockData";
import BeatCard, { BeatCover, PlayIcon } from "@/components/BeatCard";
import Waveform from "@/components/Waveform";
import { usePlayer } from "@/components/PlayerContext";

const genres = ["All", "Hip-Hop", "Trap", "R&B", "Drill", "Pop", "Afrobeats"];
const moods = ["All", "Dark", "Chill", "Energetic", "Aggressive", "Happy", "Melancholic", "Motivated"];
const BPM_MIN = 60;
const BPM_MAX = 160;
const PRICE_MAX = 300;

type Menu = "mood" | "bpm" | "key" | "price" | null;

function Chevron() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** A filter button with a small panel underneath. */
function FilterMenu({
  id, label, active, open, onToggle, children,
}: {
  id: string; label: string; active: boolean; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`filter-${id}`}
        className={`h-10 px-3.5 rounded-xl border text-sm flex items-center gap-2 transition-colors ${
          active ? "bg-wavr-raised border-wavr-lime text-wavr-text" : "bg-wavr-surface border-wavr-line text-wavr-text hover:border-wavr-edge"
        }`}
      >
        {label}
        <Chevron />
      </button>
      {open && (
        <div
          id={`filter-${id}`}
          className="absolute left-0 top-12 z-30 w-[min(280px,calc(100vw-32px))] p-4 rounded-2xl bg-wavr-surface border border-wavr-line shadow-2xl shadow-black/60"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedKey, setSelectedKey] = useState("All");
  const [bpmMin, setBpmMin] = useState(BPM_MIN);
  const [bpmMax, setBpmMax] = useState(BPM_MAX);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { currentBeat, isPlaying, setCurrentBeat } = usePlayer();

  useEffect(() => {
    fetch("/api/beats")
      .then((r) => r.json())
      .then((data) => setBeats(Array.isArray(data) ? data : []))
      .catch(() => { setBeats([]); setLoadError(true); })
      .finally(() => setLoading(false));
  }, []);

  // Close an open filter panel on outside click or Escape
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openMenu]);

  const keys = useMemo(
    () => ["All", ...Array.from(new Set(beats.map((b) => b.key).filter(Boolean))).sort()],
    [beats],
  );

  const featured = useMemo(() => beats.find((b) => b.featured) ?? beats[0] ?? null, [beats]);

  const filteredBeats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = beats.filter((b) => {
      if (selectedGenre !== "All" && b.genre !== selectedGenre) return false;
      if (selectedMood !== "All" && b.mood !== selectedMood) return false;
      if (selectedKey !== "All" && b.key !== selectedKey) return false;
      if (b.bpm < bpmMin || b.bpm > bpmMax) return false;
      if (b.priceBasic > priceMax) return false;
      if (q && !b.title.toLowerCase().includes(q) && !b.producer.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sortBy === "featured") result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (sortBy === "popular") result = [...result].sort((a, b) => b.plays - a.plays);
    else if (sortBy === "price-low") result = [...result].sort((a, b) => a.priceBasic - b.priceBasic);
    else if (sortBy === "price-high") result = [...result].sort((a, b) => b.priceBasic - a.priceBasic);
    else if (sortBy === "bpm-low") result = [...result].sort((a, b) => a.bpm - b.bpm);
    return result;
  }, [beats, selectedGenre, selectedMood, selectedKey, bpmMin, bpmMax, priceMax, searchQuery, sortBy]);

  const bpmActive = bpmMin !== BPM_MIN || bpmMax !== BPM_MAX;
  const anyFilter =
    selectedGenre !== "All" || selectedMood !== "All" || selectedKey !== "All" || bpmActive || priceMax !== PRICE_MAX || searchQuery !== "";

  function resetFilters() {
    setSelectedGenre("All");
    setSelectedMood("All");
    setSelectedKey("All");
    setBpmMin(BPM_MIN);
    setBpmMax(BPM_MAX);
    setPriceMax(PRICE_MAX);
    setSearchQuery("");
    setOpenMenu(null);
  }

  const toggleMenu = (m: Exclude<Menu, null>) => setOpenMenu((cur) => (cur === m ? null : m));
  const featuredPlaying = !!featured && currentBeat?.id === featured.id && isPlaying;

  return (
    <div className="min-h-screen bg-wavr-bg text-wavr-text">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-7">

        {/* ── Featured beat ── */}
        {loading ? (
          <div className="h-[268px] rounded-3xl bg-wavr-surface border border-wavr-line animate-pulse" />
        ) : featured ? (
          <section aria-label="Featured beat" className="flex flex-wrap gap-7 p-6 rounded-3xl bg-wavr-surface border border-wavr-line">
            <div className="relative w-full max-w-[220px] aspect-square rounded-2xl overflow-hidden shrink-0">
              <BeatCover beat={featured} className="absolute inset-0" />
              <button
                type="button"
                onClick={() => setCurrentBeat(featured)}
                aria-label={`${featuredPlaying ? "Pause" : "Play"} ${featured.title}`}
                className="absolute left-4 bottom-4 w-14 h-14 rounded-full bg-wavr-lime text-wavr-bg flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <PlayIcon playing={featuredPlaying} className={featuredPlaying ? "w-5 h-5" : "w-5 h-5 ml-0.5"} />
              </button>
            </div>
            <div className="flex-[999_1_420px] min-w-0 flex flex-col justify-center gap-3.5">
              <p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-wavr-lime">
                {featured.featured ? "Featured beat" : "New on WAVR"}
              </p>
              <h1 className="font-display font-extrabold text-4xl sm:text-[44px] leading-[1.02] tracking-tight break-words">
                {featured.title}
              </h1>
              <p className="text-wavr-muted">
                {featured.producer} · {featured.genre} · {featured.bpm} BPM{featured.key ? ` · ${featured.key}` : ""}
              </p>
              <Waveform seed={featured.id} bars={60} progress={featuredPlaying ? 0.35 : 0} className="h-12" />
              <div className="flex flex-wrap gap-2.5">
                <Link href={`/beat/${featured.id}`} className="h-11 px-5 rounded-full bg-wavr-text text-wavr-bg font-bold flex items-center hover:bg-white transition-colors">
                  License from ${featured.priceBasic}
                </Link>
                <Link href={`/beat/${featured.id}`} className="h-11 px-5 rounded-full border border-wavr-edge font-semibold flex items-center hover:border-wavr-muted transition-colors">
                  Compare licenses
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Browse controls ── */}
        <section aria-label="Browse" className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-3xl tracking-tight">Beat Marketplace</h2>
              <p className="text-wavr-muted text-[15px]">
                {loading ? "Loading beats…" : `${filteredBeats.length} ${filteredBeats.length === 1 ? "beat" : "beats"}${anyFilter ? " match" : " from independent producers"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-wavr-muted">
                Sort
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 px-3.5 rounded-xl bg-wavr-surface text-wavr-text border border-wavr-line text-sm focus:outline-none focus:border-wavr-lime"
                >
                  <option value="featured">Featured</option>
                  <option value="popular">Most popular</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="bpm-low">BPM: low to high</option>
                </select>
              </label>
              <div role="group" aria-label="View" className="flex h-11 rounded-xl border border-wavr-line overflow-hidden bg-wavr-surface">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    aria-label={v === "grid" ? "Grid view" : "List view"}
                    className={`w-11 flex items-center justify-center transition-colors ${view === v ? "bg-wavr-text text-wavr-bg" : "text-wavr-muted hover:text-wavr-text"}`}
                  >
                    {v === "grid" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <label className="flex items-center gap-2.5 h-11 px-4 rounded-full bg-wavr-surface border border-wavr-line focus-within:border-wavr-lime max-w-xl">
            <svg className="w-[18px] h-[18px] text-[#8E8E9C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="sr-only">Search beats</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats, producers…"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-wavr-text placeholder:text-[#8E8E9C] text-[15px]"
            />
          </label>

          {/* Genre chips */}
          <div role="group" aria-label="Genre" className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            {genres.map((g) => {
              const on = selectedGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGenre(g)}
                  aria-pressed={on}
                  className={`shrink-0 h-10 px-[18px] rounded-full text-sm font-semibold border transition-colors ${
                    on ? "bg-wavr-text text-wavr-bg border-wavr-text" : "bg-wavr-surface text-wavr-text border-wavr-line hover:border-wavr-edge"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Filter menus */}
          <div ref={filtersRef} className="flex flex-wrap gap-2">
            <FilterMenu id="mood" label={selectedMood === "All" ? "Mood" : selectedMood} active={selectedMood !== "All"} open={openMenu === "mood"} onToggle={() => toggleMenu("mood")}>
              <div className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setSelectedMood(m); setOpenMenu(null); }}
                    aria-pressed={selectedMood === m}
                    className={`h-9 px-3 rounded-full text-[13px] border transition-colors ${
                      selectedMood === m ? "bg-wavr-lime text-wavr-bg border-wavr-lime font-bold" : "border-wavr-edge text-wavr-soft hover:text-wavr-text"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </FilterMenu>

            <FilterMenu id="bpm" label={`BPM ${bpmMin}–${bpmMax}`} active={bpmActive} open={openMenu === "bpm"} onToggle={() => toggleMenu("bpm")}>
              <div className="flex flex-col gap-3 text-sm">
                <label className="flex flex-col gap-1.5 text-wavr-muted">
                  Min BPM <span className="text-wavr-text font-semibold">{bpmMin}</span>
                  <input type="range" min={BPM_MIN} max={BPM_MAX} value={bpmMin}
                    onChange={(e) => setBpmMin(Math.min(Number(e.target.value), bpmMax))}
                    className="w-full accent-[#C6FF3D]" />
                </label>
                <label className="flex flex-col gap-1.5 text-wavr-muted">
                  Max BPM <span className="text-wavr-text font-semibold">{bpmMax}</span>
                  <input type="range" min={BPM_MIN} max={BPM_MAX} value={bpmMax}
                    onChange={(e) => setBpmMax(Math.max(Number(e.target.value), bpmMin))}
                    className="w-full accent-[#C6FF3D]" />
                </label>
              </div>
            </FilterMenu>

            <FilterMenu id="key" label={selectedKey === "All" ? "Key" : selectedKey} active={selectedKey !== "All"} open={openMenu === "key"} onToggle={() => toggleMenu("key")}>
              {keys.length <= 1 ? (
                <p className="text-wavr-muted text-sm">No keys to filter yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                  {keys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setSelectedKey(k); setOpenMenu(null); }}
                      aria-pressed={selectedKey === k}
                      className={`h-9 px-3 rounded-full text-[13px] border transition-colors ${
                        selectedKey === k ? "bg-wavr-lime text-wavr-bg border-wavr-lime font-bold" : "border-wavr-edge text-wavr-soft hover:text-wavr-text"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </FilterMenu>

            <FilterMenu id="price" label={priceMax === PRICE_MAX ? "Price" : `Under $${priceMax}`} active={priceMax !== PRICE_MAX} open={openMenu === "price"} onToggle={() => toggleMenu("price")}>
              <label className="flex flex-col gap-1.5 text-sm text-wavr-muted">
                Max basic license price <span className="text-wavr-text font-semibold">${priceMax}</span>
                <input type="range" min={10} max={PRICE_MAX} step={10} value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[#C6FF3D]" />
              </label>
            </FilterMenu>

            {anyFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 px-3.5 rounded-xl border border-dashed border-wavr-edge text-wavr-muted text-sm hover:text-wavr-text transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* ── Beats ── */}
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-3 rounded-[18px] bg-wavr-card border border-[#1E1E27] animate-pulse">
                <div className="aspect-square rounded-xl bg-wavr-raised" />
                <div className="h-4 mt-4 rounded bg-wavr-raised w-3/4" />
                <div className="h-3 mt-2 rounded bg-wavr-raised w-1/2" />
                <div className="h-11 mt-4 rounded-xl bg-wavr-raised" />
              </div>
            ))}
          </div>
        ) : filteredBeats.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-wavr-line">
            <h3 className="font-display font-bold text-2xl mb-2">
              {loadError ? "Couldn't load beats" : beats.length === 0 ? "No beats yet" : "No beats match"}
            </h3>
            <p className="text-wavr-muted mb-5">
              {loadError ? "Check your connection and refresh." : beats.length === 0 ? "Check back soon for new drops." : "Try a different genre or loosen the filters."}
            </p>
            {anyFilter && (
              <button type="button" onClick={resetFilters} className="h-11 px-5 rounded-full bg-wavr-text text-wavr-bg font-bold">
                Clear filters
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <section aria-label="Beats" className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-5">
            {filteredBeats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                onPlay={(b) => setCurrentBeat(b)}
                isPlaying={currentBeat?.id === beat.id && isPlaying}
                isCurrent={currentBeat?.id === beat.id}
              />
            ))}
          </section>
        ) : (
          <section aria-label="Beats" className="flex flex-col gap-1.5">
            {filteredBeats.map((beat) => {
              const playing = currentBeat?.id === beat.id && isPlaying;
              const current = currentBeat?.id === beat.id;
              return (
                <article
                  key={beat.id}
                  className={`flex items-center gap-3 p-2 pr-3 rounded-2xl transition-colors ${current ? "bg-[#17171F]" : "hover:bg-wavr-card"}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentBeat(beat)}
                    aria-label={`${playing ? "Pause" : "Play"} ${beat.title}`}
                    className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden"
                  >
                    <BeatCover beat={beat} className="absolute inset-0" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-wavr-bg ${playing ? "bg-wavr-lime" : "bg-wavr-text"}`}>
                        <PlayIcon playing={playing} className={playing ? "w-3 h-3" : "w-3 h-3 ml-px"} />
                      </span>
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/beat/${beat.id}`} className="block text-[15px] font-bold truncate hover:underline">{beat.title}</Link>
                    <p className="text-xs text-wavr-muted truncate">
                      {beat.producer} · {beat.bpm} BPM{beat.key ? ` · ${beat.key}` : ""}
                    </p>
                  </div>
                  <span className="hidden md:inline text-xs text-wavr-muted w-24 truncate">{beat.genre}</span>
                  {beat.mood && <span className="hidden lg:inline text-xs text-wavr-muted w-24 truncate">{beat.mood}</span>}
                  <Link
                    href={`/beat/${beat.id}`}
                    className="shrink-0 h-10 px-3.5 rounded-xl bg-wavr-text text-wavr-bg text-[13px] font-bold flex items-center hover:bg-white transition-colors"
                  >
                    ${beat.priceBasic}
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
