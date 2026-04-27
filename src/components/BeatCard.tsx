"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beat } from "@/lib/mockData";

const genreGradients: Record<string, string> = {
  Trap: "from-red-600 via-red-900/40 to-black",
  "R&B": "from-gray-800 via-gray-900 to-black",
  Afrobeats: "from-red-900 via-gray-900 to-black",
  Drill: "from-gray-800 via-slate-900 to-black",
  Pop: "from-gray-900 via-gray-950 to-black",
  "Hip-Hop": "from-red-800 via-red-950 to-black",
};

interface BeatCardProps {
  beat: Beat;
  onPlay?: (beat: Beat) => void;
  isPlaying?: boolean;
}

export default function BeatCard({ beat, onPlay, isPlaying }: BeatCardProps) {
  const router = useRouter();
  const [showLicenses, setShowLicenses] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const gradient = genreGradients[beat.genre] || "from-purple-900 via-gray-900 to-black";

  async function handleLicense(licenseType: "basic" | "premium" | "exclusive") {
    setPurchaseError("");
    setPurchasing(true);
    try {
      const res = await fetch("/api/checkout/beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: beat.id, licenseType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setPurchaseError(data.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPurchaseError("Something went wrong. Try again.");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 group">
      {/* Artwork */}
      <div
        className={`relative h-44 bg-gradient-to-br ${gradient} cursor-pointer`}
        onClick={() => onPlay?.(beat)}
      >
        {/* Waveform decoration */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg viewBox="0 0 200 60" className="w-full h-16">
            {Array.from({ length: 40 }, (_, i) => (
              <rect
                key={i}
                x={i * 5}
                y={30 - Math.random() * 25}
                width="3"
                height={Math.random() * 50 + 10}
                fill="white"
                opacity={0.6 + Math.random() * 0.4}
              />
            ))}
          </svg>
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isPlaying
                ? "bg-red-600 shadow-lg shadow-red-600/50 scale-110"
                : "bg-black/50 backdrop-blur-sm group-hover:bg-red-600/80 group-hover:scale-110"
            }`}
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Genre badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/60 backdrop-blur-sm text-xs text-gray-300 px-2.5 py-1 rounded-full font-medium border border-gray-700/50">
            {beat.genre}
          </span>
        </div>

        {/* Featured badge */}
        {beat.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-600 text-xs text-white px-2.5 py-1 rounded-full font-bold shadow-md">
              Featured
            </span>
          </div>
        )}

        {/* Play count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-xs text-gray-400">
            {beat.plays >= 1000
              ? `${(beat.plays / 1000).toFixed(1)}k`
              : beat.plays}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{beat.title}</h3>
            {beat.producerId ? (
              <a href={`/p/${beat.producerId}`} className="text-red-500 text-xs mt-0.5 truncate hover:text-red-400 transition-colors block">
                by {beat.producer}
              </a>
            ) : (
              <p className="text-red-500 text-xs mt-0.5 truncate">by {beat.producer}</p>
            )}
          </div>
          <span className="text-white font-bold text-sm ml-2 shrink-0">
            from ${beat.priceBasic}
          </span>
        </div>

        {/* BPM & Key */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">{beat.bpm}</span> BPM
          </span>
          <span className="text-gray-700">•</span>
          <span className="text-xs text-gray-500">
            Key:{" "}
            <span className="text-gray-400 font-medium">{beat.key}</span>
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {beat.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        {!showLicenses ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLicenses(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors duration-200 shadow-sm"
            >
              License
            </button>
            <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold py-2 px-3 rounded-lg transition-colors duration-200 border border-gray-700">
              + Cart
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {purchaseError && (
              <p className="text-red-400 text-xs text-center pb-1">{purchaseError}</p>
            )}
            <button
              onClick={() => handleLicense("basic")}
              disabled={purchasing}
              className="w-full flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed group/lic transition-colors"
            >
              <div className="text-left">
                <p className="text-white text-xs font-semibold">Basic</p>
                <p className="text-gray-500 text-xs">MP3 only</p>
              </div>
              <span className="text-red-500 text-sm font-bold group-hover/lic:text-red-400">
                ${beat.priceBasic}
              </span>
            </button>
            <button
              onClick={() => handleLicense("premium")}
              disabled={purchasing}
              className="w-full flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed group/lic border border-purple-700/30 transition-colors"
            >
              <div className="text-left">
                <p className="text-white text-xs font-semibold">Premium</p>
                <p className="text-gray-500 text-xs">MP3 + WAV + Stems</p>
              </div>
              <span className="text-red-500 text-sm font-bold group-hover/lic:text-red-400">
                ${beat.pricePremium}
              </span>
            </button>
            <button
              onClick={() => handleLicense("exclusive")}
              disabled={purchasing || beat.status === "exclusive_sold"}
              className="w-full flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed group/lic border border-red-600/30 transition-colors"
            >
              <div className="text-left">
                <p className="text-white text-xs font-semibold">
                  Exclusive
                  {beat.status === "exclusive_sold" && (
                    <span className="ml-2 text-red-400 font-normal">Sold</span>
                  )}
                </p>
                <p className="text-gray-500 text-xs">Full ownership</p>
              </div>
              <span className="text-red-500 text-sm font-bold group-hover/lic:text-red-400">
                ${beat.priceExclusive}
              </span>
            </button>
            {purchasing && (
              <p className="text-center text-gray-500 text-xs py-1">Redirecting to checkout…</p>
            )}
            <button
              onClick={() => { setShowLicenses(false); setPurchaseError(""); }}
              className="w-full text-gray-500 text-xs py-1 hover:text-gray-400 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
