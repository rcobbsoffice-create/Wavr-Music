"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Beat } from "@/lib/mockData";

// Fallback cover colours per genre (base, ring) when a beat has no artwork
export const genreCover: Record<string, [string, string]> = {
  Trap: ["#2B1B4E", "#7C5CFF"],
  "R&B": ["#3A1F2B", "#FF6B8A"],
  Drill: ["#13283A", "#3DD6FF"],
  Afrobeats: ["#3A2A12", "#FFB23D"],
  Pop: ["#16302A", "#3DFFB0"],
  "Hip-Hop": ["#1B2340", "#8FA3FF"],
};
const defaultCover: [string, string] = ["#1C1C25", "#C6FF3D"];

export function BeatCover({ beat, className = "" }: { beat: Beat; className?: string }) {
  const [base, ring] = genreCover[beat.genre] ?? defaultCover;
  return (
    <div className={`overflow-hidden ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`} style={{ background: base }}>
      {beat.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={beat.artwork} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" fill="none" stroke={ring} strokeWidth="1.5" aria-hidden="true" className="absolute inset-0 w-full h-full">
          <circle cx="78" cy="22" r="14" />
          <circle cx="78" cy="22" r="26" />
          <circle cx="78" cy="22" r="38" />
        </svg>
      )}
    </div>
  );
}

export function PlayIcon({ playing, className = "w-5 h-5" }: { playing: boolean; className?: string }) {
  return playing ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

interface BeatCardProps {
  beat: Beat;
  onPlay?: (beat: Beat) => void;
  isPlaying?: boolean;
  isCurrent?: boolean;
}

export default function BeatCard({ beat, onPlay, isPlaying, isCurrent }: BeatCardProps) {
  const router = useRouter();
  const [showLicenses, setShowLicenses] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const active = isCurrent ?? isPlaying;

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

  const licenses = [
    { type: "basic" as const, name: "Basic", desc: "MP3", price: beat.priceBasic },
    { type: "premium" as const, name: "Premium", desc: "MP3 + WAV + stems", price: beat.pricePremium },
    { type: "exclusive" as const, name: "Exclusive", desc: "Full ownership", price: beat.priceExclusive, sold: beat.status === "exclusive_sold" },
  ];

  return (
    <article
      className={`flex flex-col gap-3 p-3 bg-wavr-card rounded-[18px] border transition-colors ${
        active ? "border-wavr-lime" : "border-[#1E1E27] hover:border-wavr-edge"
      }`}
    >
      {/* Cover + play */}
      <div className="relative aspect-square rounded-xl overflow-hidden group">
        <BeatCover beat={beat} className="absolute inset-0" />
        <span className="absolute left-2.5 top-2.5 px-2.5 py-1 rounded-full bg-wavr-bg/90 text-wavr-text text-xs font-semibold">
          {beat.genre}
        </span>
        {beat.featured && (
          <span className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-full bg-wavr-lime text-wavr-bg text-xs font-bold">
            Featured
          </span>
        )}
        <button
          type="button"
          onClick={() => onPlay?.(beat)}
          aria-label={`${isPlaying ? "Pause" : "Play"} ${beat.title}`}
          className={`absolute right-2.5 bottom-2.5 w-12 h-12 rounded-full flex items-center justify-center text-wavr-bg transition-transform group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isPlaying ? "bg-wavr-lime" : "bg-wavr-text"
          }`}
        >
          <PlayIcon playing={!!isPlaying} className={isPlaying ? "w-[18px] h-[18px]" : "w-[18px] h-[18px] ml-0.5"} />
        </button>
      </div>

      {/* Title + producer */}
      <div className="flex flex-col gap-0.5 px-0.5 min-w-0">
        <Link href={`/beat/${beat.id}`} className="text-wavr-text text-[17px] font-bold truncate hover:underline">
          {beat.title || "Untitled Beat"}
        </Link>
        {beat.producerId ? (
          <Link href={`/p/${beat.producerId}`} className="text-wavr-muted text-sm truncate hover:text-wavr-text transition-colors">
            {beat.producer || "Unknown"}
          </Link>
        ) : (
          <p className="text-wavr-muted text-sm truncate">{beat.producer || "Unknown"}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 px-0.5">
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-wavr-raised text-wavr-soft">{beat.bpm} BPM</span>
        {beat.key && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-wavr-raised text-wavr-soft">{beat.key}</span>}
        {beat.mood && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-wavr-raised text-wavr-soft">{beat.mood}</span>}
      </div>

      {/* Actions */}
      {!showLicenses ? (
        <div className="flex items-center gap-2 px-0.5 pt-0.5 mt-auto">
          <button
            type="button"
            onClick={() => setShowLicenses(true)}
            className="flex-1 h-11 rounded-xl bg-wavr-text text-wavr-bg text-sm font-bold hover:bg-white transition-colors"
          >
            From ${beat.priceBasic}
          </button>
          <Link
            href={`/beat/${beat.id}`}
            aria-label={`View ${beat.title}`}
            className="w-11 h-11 shrink-0 rounded-xl border border-wavr-edge text-wavr-text flex items-center justify-center hover:border-wavr-muted transition-colors"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-auto">
          {purchaseError && <p className="text-[#FF8A7A] text-xs text-center">{purchaseError}</p>}
          {licenses.map((l) => (
            <button
              key={l.type}
              type="button"
              onClick={() => handleLicense(l.type)}
              disabled={purchasing || l.sold}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 bg-wavr-raised hover:bg-wavr-line disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              <span>
                <span className="block text-wavr-text text-xs font-semibold">
                  {l.name}
                  {l.sold && <span className="ml-2 text-wavr-muted font-normal">Sold</span>}
                </span>
                <span className="block text-wavr-muted text-xs">{l.desc}</span>
              </span>
              <span className="text-wavr-lime text-sm font-bold">${l.price}</span>
            </button>
          ))}
          {purchasing && <p className="text-center text-wavr-muted text-xs py-1">Redirecting to checkout…</p>}
          <button
            type="button"
            onClick={() => { setShowLicenses(false); setPurchaseError(""); }}
            className="w-full text-wavr-muted text-xs py-1.5 hover:text-wavr-text transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </article>
  );
}
