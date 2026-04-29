"use client";

import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/components/PlayerContext";

export default function AudioPlayer() {
  const { currentBeat, isPlaying, togglePlay, setCurrentBeat } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  // When the beat changes, load the new src and play if needed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    if (!currentBeat?.audioFile) {
      audio.pause();
      audio.src = "";
      return;
    }
    const audioSrc = currentBeat.audioFile.includes("huggingface.co")
      ? `/api/audio?url=${encodeURIComponent(currentBeat.audioFile)}`
      : currentBeat.audioFile;
    audio.src = audioSrc;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat?.id]);

  // Sync play/pause state when toggled without changing the beat
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentBeat?.audioFile) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]); // eslint-disable-line

  // Keep volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  if (!currentBeat) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function formatTime(secs: number) {
    if (!isFinite(secs) || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }

  const hasAudio = Boolean(currentBeat.audioFile);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setCurrentBeat(null)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Track info */}
          <div className="flex items-center gap-3 w-64 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-700 to-fuchsia-800 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{currentBeat.title}</p>
              <p className="text-gray-400 text-xs truncate">{currentBeat.producer}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-5">
              <button
                onClick={togglePlay}
                disabled={!hasAudio}
                className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-lg shadow-purple-900/40"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Progress bar */}
            {hasAudio ? (
              <div className="flex items-center gap-2 w-full max-w-lg">
                <span className="text-gray-500 text-xs w-8 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer group relative"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-gray-500 text-xs w-8 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No preview available</p>
            )}
          </div>

          {/* Volume & close */}
          <div className="flex items-center gap-3 w-48 justify-end shrink-0">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-purple-500 cursor-pointer"
            />
            <button
              onClick={() => setCurrentBeat(null)}
              className="text-gray-600 hover:text-gray-400 transition-colors ml-1"
              aria-label="Close player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
