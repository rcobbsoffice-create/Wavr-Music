"use client";

import { useState, useMemo, useEffect } from "react";
import { Beat } from "@/lib/mockData";
import BeatCard from "@/components/BeatCard";
import { usePlayer } from "@/components/PlayerContext";

const genres = ["All", "Hip-Hop", "Trap", "R&B", "Drill", "Pop", "Afrobeats"];
const moods = ["All", "Dark", "Chill", "Energetic", "Aggressive", "Happy", "Melancholic", "Motivated"];

export default function MarketplacePage() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMood, setSelectedMood] = useState("All");
  const [bpmMin, setBpmMin] = useState(60);
  const [bpmMax, setBpmMax] = useState(160);
  const [priceMax, setPriceMax] = useState(300);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { currentBeat, isPlaying, setCurrentBeat } = usePlayer();

  useEffect(() => {
    console.log("Fetching beats from /api/beats...");
    fetch("/api/beats")
      .then((r) => r.json())
      .then((data) => {
        console.log("Beats data received:", data);
        setBeats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load beats:", err);
        setBeats([]);
        setLoading(false);
      });
  }, []);

  const featuredBeats = Array.isArray(beats) ? beats.filter((b) => b.featured) : [];

  const filteredBeats = useMemo(() => {
    if (!Array.isArray(beats)) return [];
    
    let result = beats.filter((b) => {
      if (selectedGenre !== "All" && b.genre !== selectedGenre) return false;
      if (selectedMood !== "All" && b.mood !== selectedMood) return false;
      if (selectedType !== "All") {
        const typeMap: Record<string, string> = { "Beats": "beat", "Sound Kits": "sound-kit", "Collections": "collection" };
        if (b.type !== typeMap[selectedType]) return false;
      }
      if (b.bpm < bpmMin || b.bpm > bpmMax) return false;
      if (b.priceBasic > priceMax) return false;
      if (
        searchQuery &&
        !b.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !b.producer.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    if (sortBy === "featured") result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (sortBy === "popular") result = [...result].sort((a, b) => b.plays - a.plays);
    else if (sortBy === "price-low") result = [...result].sort((a, b) => a.priceBasic - b.priceBasic);
    else if (sortBy === "price-high") result = [...result].sort((a, b) => b.priceBasic - a.priceBasic);
    else if (sortBy === "bpm-low") result = [...result].sort((a, b) => a.bpm - b.bpm);

    return result;
  }, [beats, selectedGenre, selectedMood, bpmMin, bpmMax, priceMax, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Beat Marketplace
          </h1>
          <p className="text-gray-400 mb-6">
            Discover and license beats from the world&apos;s best producers
          </p>
          {/* Search */}
          <div className="relative w-full max-w-xl">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search beats, producers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Featured Carousel */}
      {featuredBeats.length > 0 && (
        <div className="bg-gray-900/50 border-b border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4">
              Featured Beats
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {featuredBeats.map((beat) => (
                <div
                  key={beat.id}
                  className="shrink-0 w-64 bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-red-600/50 cursor-pointer transition-all duration-200 group"
                  onClick={() => setCurrentBeat(beat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                      {currentBeat?.id === beat.id && isPlaying ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{beat.title}</p>
                      <p className="text-gray-400 text-xs">{beat.producer}</p>
                      <p className="text-red-600 text-xs font-bold">from ${beat.priceBasic}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketplace Type Selector */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-2xl flex gap-2">
            {["All", "Beats", "Sound Kits", "Collections"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedType === t
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Filters Above Cards - Vertically Stacked */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-6">
            {/* Genre */}
            <div className="flex flex-col items-center">
              <h3 className="text-white font-semibold text-sm mb-3">Genre</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${
                      selectedGenre === g
                        ? "bg-red-600/20 text-red-500 border border-red-600/40 font-bold"
                        : "text-gray-400 border border-gray-700 hover:text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="flex flex-col items-center">
              <h3 className="text-white font-semibold text-sm mb-3">Mood</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedMood === m
                        ? "border-red-600 bg-red-950/20 text-red-500 font-bold"
                        : "border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
              {/* BPM Range */}
              <div className="flex flex-col items-center">
                <h3 className="text-white font-semibold text-sm mb-3">
                  BPM Range:{" "}
                  <span className="text-red-600 font-bold">
                    {bpmMin} – {bpmMax}
                  </span>
                </h3>
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 text-center">
                    <label className="text-xs text-gray-500 mb-1 block">Min BPM</label>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      value={bpmMin}
                      onChange={(e) => setBpmMin(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <label className="text-xs text-gray-500 mb-1 block">Max BPM</label>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      value={bpmMax}
                      onChange={(e) => setBpmMax(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex flex-col items-center">
                <h3 className="text-white font-semibold text-sm mb-3">
                  Max Basic Price:{" "}
                  <span className="text-red-600 font-bold">${priceMax}</span>
                </h3>
                <div className="pt-5 w-full">
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={10}
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setSelectedGenre("All");
                  setSelectedMood("All");
                  setBpmMin(60);
                  setBpmMax(160);
                  setPriceMax(300);
                  setSelectedType("All");
                  setSearchQuery("");
                }}
                className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400 text-sm">
                {loading ? (
                  <span className="text-gray-500">Loading...</span>
                ) : (
                  <><span className="text-white font-semibold">{filteredBeats.length}</span> beats found</>
                )}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
              >
                <option value="featured">Featured</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="bpm-low">BPM: Low to High</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1 ml-4">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "list"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Beat Grid/List */}
            {loading ? (
              <div className={`grid ${viewMode === "grid" ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"} gap-5`}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse ${viewMode === "list" ? "h-32" : ""}`}>
                    {viewMode === "grid" ? (
                      <>
                        <div className="h-44 bg-gray-800" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-800 rounded w-3/4" />
                          <div className="h-3 bg-gray-800 rounded w-1/2" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center p-4 gap-4">
                        <div className="w-48 h-24 bg-gray-800 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-800 rounded w-1/3" />
                          <div className="h-3 bg-gray-800 rounded w-1/4" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : filteredBeats.length > 0 ? (
              <div className={`grid ${viewMode === "grid" ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"} gap-5`}>
                {filteredBeats.map((beat) => (
                  <BeatCard
                    key={beat.id}
                    beat={beat}
                    onPlay={(b) => setCurrentBeat(b)}
                    isPlaying={currentBeat?.id === beat.id && isPlaying}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-white font-semibold text-xl mb-2">No beats found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
