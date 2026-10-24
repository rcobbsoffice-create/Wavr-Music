"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerContext";
import { BeatCover, PlayIcon } from "@/components/BeatCard";
import Waveform from "@/components/Waveform";

export default function AudioPlayer() {
  const { currentBeat, isPlaying, togglePlay, setCurrentBeat, watermarkedActive } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Check if current beat is saved when it changes
  useEffect(() => {
    if (!currentBeat) return;
    setLiked(false);
    fetch("/api/beats/save")
      .then(r => r.ok ? r.json() : [])
      .then((beats: { id: string }[]) => {
        if (Array.isArray(beats)) setLiked(beats.some(b => b.id === currentBeat.id));
      })
      .catch(() => {});
  }, [currentBeat?.id]);

  async function toggleLike() {
    if (!currentBeat || liking) return;
    setLiking(true);
    try {
      const res = await fetch("/api/beats/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: currentBeat.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.saved);
      }
    } catch {}
    setLiking(false);
  }

  // Load a new source only when the beat itself changes
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
    if (watermarkedActive) {
      // WatermarkedPlayer owns playback — don't touch the src yet
      return;
    }
    const audioSrc = currentBeat.audioFile.includes("huggingface.co")
      ? `/api/audio?url=${encodeURIComponent(currentBeat.audioFile)}`
      : currentBeat.audioFile;
    audio.src = audioSrc;
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat?.id]);

  // When WatermarkedPlayer hands back control, resume without reloading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentBeat?.audioFile) return;
    if (watermarkedActive) {
      audio.pause();
    } else {
      // Restore src if it was cleared, then resume
      const audioSrc = currentBeat.audioFile.includes("huggingface.co")
        ? `/api/audio?url=${encodeURIComponent(currentBeat.audioFile)}`
        : currentBeat.audioFile;
      if (!audio.src || audio.src === window.location.href) {
        audio.src = audioSrc;
        audio.load();
      }
      if (isPlaying) audio.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watermarkedActive]);

  // Sync play/pause when toggled without a beat or watermark change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentBeat?.audioFile || watermarkedActive) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, watermarkedActive]); // eslint-disable-line

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


  const hasAudio = Boolean(currentBeat.audioFile);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setCurrentBeat(null)}
      />

      <section
        aria-label="Now playing"
        className="fixed bottom-0 left-0 right-0 z-50 bg-wavr-card/95 backdrop-blur-xl border-t border-wavr-line"
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-3 sm:gap-x-5 gap-y-2">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 sm:flex-[1_1_220px] min-w-0">
            <Link href={`/beat/${currentBeat.id}`} className="w-12 h-12 rounded-[10px] overflow-hidden shrink-0" aria-label={`Open ${currentBeat.title}`}>
              <BeatCover beat={currentBeat} className="w-full h-full" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/beat/${currentBeat.id}`} className="block text-wavr-text text-[15px] font-bold truncate hover:underline">
                {currentBeat.title}
              </Link>
              <p className="text-wavr-muted text-[13px] truncate">
                {currentBeat.producer}{currentBeat.bpm ? ` · ${currentBeat.bpm} BPM` : ""}
              </p>
            </div>
          </div>

          {/* Controls + waveform */}
          <div className="flex items-center gap-3 basis-full sm:basis-auto sm:flex-[3_1_360px] min-w-0 order-last sm:order-none">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!hasAudio}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-11 h-11 shrink-0 rounded-full bg-wavr-lime text-wavr-bg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 transition-transform"
            >
              <PlayIcon playing={isPlaying} className={isPlaying ? "w-[18px] h-[18px]" : "w-[18px] h-[18px] ml-0.5"} />
            </button>
            {watermarkedActive ? (
              <p className="text-wavr-muted text-xs">Seek on the player above</p>
            ) : hasAudio ? (
              <>
                <span className="text-wavr-muted text-xs tabular-nums w-9 text-right shrink-0">{formatTime(currentTime)}</span>
                <Waveform
                  seed={currentBeat.id}
                  bars={72}
                  progress={progress / 100}
                  onSeek={(f) => { if (audioRef.current && duration) audioRef.current.currentTime = f * duration; }}
                  label={`Seek ${currentBeat.title}`}
                  className="flex-1 min-w-[80px] h-8"
                />
                <span className="text-wavr-muted text-xs tabular-nums w-9 shrink-0">{formatTime(duration)}</span>
              </>
            ) : (
              <p className="text-wavr-muted text-xs">No preview available</p>
            )}
          </div>

          {/* Like, volume, license, close */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLike}
              disabled={liking}
              aria-label={liked ? "Remove from saved beats" : "Save beat"}
              aria-pressed={liked}
              className={`hidden sm:flex w-11 h-11 rounded-full border items-center justify-center transition-colors disabled:opacity-40 ${
                liked ? "border-wavr-lime text-wavr-lime" : "border-wavr-edge text-wavr-text hover:border-wavr-muted"
              }`}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </button>
            <label className="hidden lg:flex items-center gap-2 text-wavr-muted">
              <span className="sr-only">Volume</span>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 accent-[#C6FF3D] cursor-pointer"
              />
            </label>
            <Link
              href={`/beat/${currentBeat.id}`}
              className="h-10 sm:h-11 px-3.5 sm:px-[18px] rounded-full bg-wavr-text text-wavr-bg text-[13px] sm:text-sm font-bold flex items-center hover:bg-white transition-colors whitespace-nowrap"
            >
              License ${currentBeat.priceBasic}
            </Link>
            <button
              type="button"
              onClick={() => setCurrentBeat(null)}
              aria-label="Close player"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full text-wavr-muted hover:text-wavr-text flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
