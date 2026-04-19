"use client";

import { useState, useEffect, useRef } from "react";

interface Stem {
  type: string;
  status: string;
  filePath: string | null;
}

const STEM_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  drums:  { label: "Drums",  color: "bg-red-600",    emoji: "🥁" },
  bass:   { label: "Bass",   color: "bg-blue-600",   emoji: "🎸" },
  melody: { label: "Melody", color: "bg-purple-600", emoji: "🎹" },
  other:  { label: "Other",  color: "bg-green-600",  emoji: "🎵" },
};

interface StemPlayerProps {
  beatId: string;
  hasExclusive?: boolean;
}

export default function StemPlayer({ beatId, hasExclusive = false }: StemPlayerProps) {
  const [stems, setStems] = useState<Stem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStem, setActiveStem] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    fetch(`/api/beats/${beatId}/stems`)
      .then((r) => r.json())
      .then((data) => setStems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [beatId]);

  const readyStems = stems.filter((s) => s.status === "ready" && s.filePath);
  const processing = stems.some((s) => s.status === "processing" || s.status === "pending");
  const hasAny = stems.length > 0;

  function toggleStem(type: string) {
    setActiveStem(activeStem === type ? null : type);
  }

  function toggleMute(type: string) {
    setMutedStems((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function playAll() {
    readyStems.forEach((s) => {
      const audio = audioRefs.current[s.type];
      if (audio && !mutedStems.has(s.type)) audio.play();
    });
    setPlaying(true);
  }

  function pauseAll() {
    Object.values(audioRefs.current).forEach((a) => a.pause());
    setPlaying(false);
  }

  if (loading) {
    return <div className="h-10 bg-gray-800 animate-pulse rounded-lg" />;
  }

  if (!hasAny) {
    return (
      <div className="text-gray-600 text-xs px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
        Stems not yet generated for this beat.
      </div>
    );
  }

  if (processing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-gray-400 text-xs">Stems processing… check back soon.</span>
      </div>
    );
  }

  if (readyStems.length === 0) {
    return (
      <div className="text-gray-600 text-xs px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
        Stem separation unavailable for this beat.
      </div>
    );
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-300 text-xs font-semibold tracking-wide uppercase">Stems Preview</p>
        <div className="flex items-center gap-2">
          {readyStems.some((s) => s.filePath) && (
            <button
              onClick={playing ? pauseAll : playAll}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg flex items-center gap-1.5"
            >
              {playing ? (
                <><span>⏸</span> Pause</>
              ) : (
                <><span>▶</span> Play All</>
              )}
            </button>
          )}
          {!hasExclusive && (
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">Preview only</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {readyStems.map((stem) => {
          const info = STEM_LABELS[stem.type] ?? { label: stem.type, color: "bg-gray-600", emoji: "🎵" };
          const isMuted = mutedStems.has(stem.type);
          const isActive = activeStem === stem.type;

          return (
            <div
              key={stem.type}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? "bg-purple-900/30 border-purple-700/50"
                  : "bg-gray-800 border-gray-700/50 hover:border-gray-600"
              }`}
              onClick={() => toggleStem(stem.type)}
            >
              <span className="text-base">{info.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs font-medium">{info.label}</p>
                <div className={`h-1 rounded-full mt-1 ${info.color} ${isActive ? "animate-pulse" : "opacity-30"}`} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(stem.type); }}
                className={`text-xs w-6 h-6 flex items-center justify-center rounded ${
                  isMuted ? "bg-gray-700 text-gray-600" : "bg-gray-700 hover:bg-gray-600 text-gray-400"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              {stem.filePath && (
                <audio
                  ref={(el) => { if (el) audioRefs.current[stem.type] = el; }}
                  src={stem.filePath}
                  loop
                  style={{ display: "none" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {hasExclusive && readyStems.filter((s) => s.filePath).length > 0 && (
        <div className="pt-2 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 mb-2">Download individual stems (exclusive license)</p>
          <div className="flex flex-wrap gap-2">
            {readyStems.filter((s) => s.filePath).map((s) => (
              <a
                key={s.type}
                href={s.filePath!}
                download
                className="text-xs text-purple-400 hover:text-purple-300 bg-purple-900/20 border border-purple-700/30 px-3 py-1 rounded-lg"
              >
                ↓ {STEM_LABELS[s.type]?.label ?? s.type}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
