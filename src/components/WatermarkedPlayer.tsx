"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/components/PlayerContext";
import { Beat } from "@/lib/mockData";

interface Props {
  beat: Beat;
  tagUrl?: string | null;
  tagIntervalSeconds?: number;
  className?: string;
}

export default function WatermarkedPlayer({ beat, tagUrl, tagIntervalSeconds = 5, className = "" }: Props) {
  const { currentBeat, isPlaying, setCurrentBeat, setWatermarkedActive } = usePlayer();

  const isThisBeat = currentBeat?.id === beat.id;

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const tagBufferRef = useRef<AudioBuffer | null>(null);
  const mainBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const tagIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const internalPlayingRef = useRef(false);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const fetchBuffer = useCallback(async (url: string) => {
    const ctx = getCtx();
    const fetchUrl = url.includes("huggingface.co")
      ? `/api/audio?url=${encodeURIComponent(url)}`
      : url;
    const res = await fetch(fetchUrl);
    const ab = await res.arrayBuffer();
    return ctx.decodeAudioData(ab);
  }, []);

  // Load audio buffers
  useEffect(() => {
    let cancelled = false;
    if (!beat.audioFile) return;
    setBuffering(true);
    fetchBuffer(beat.audioFile)
      .then((buf) => { if (!cancelled) { mainBufferRef.current = buf; setDuration(buf.duration); setBuffering(false); } })
      .catch(() => { if (!cancelled) setBuffering(false); });
    if (tagUrl) fetchBuffer(tagUrl).then((buf) => { if (!cancelled) tagBufferRef.current = buf; }).catch(() => {});
    return () => { cancelled = true; };
  }, [beat.audioFile, tagUrl, fetchBuffer]);

  // Register as active watermarked player on mount
  useEffect(() => {
    setWatermarkedActive(true);
    return () => setWatermarkedActive(false);
  }, [setWatermarkedActive]);

  const fireTag = useCallback(() => {
    if (!tagBufferRef.current) return;
    const ctx = getCtx();
    const src = ctx.createBufferSource();
    src.buffer = tagBufferRef.current;
    const gain = ctx.createGain();
    gain.gain.value = 1.2;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }, []);

  const stopSource = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    sourceRef.current = null;
    if (tagIntervalRef.current) { clearInterval(tagIntervalRef.current); tagIntervalRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    internalPlayingRef.current = false;
  }, []);

  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !mainBufferRef.current) return;
    const elapsed = ctx.currentTime - startTimeRef.current + pauseOffsetRef.current;
    const dur = mainBufferRef.current.duration;
    setCurrentTime(Math.min(elapsed, dur));
    setProgress(Math.min((elapsed / dur) * 100, 100));
    if (elapsed < dur) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      stopSource();
      pauseOffsetRef.current = 0;
      setProgress(0);
      setCurrentTime(0);
      setCurrentBeat(null);
    }
  }, [stopSource, setCurrentBeat]);

  const startPlayback = useCallback((offset: number) => {
    const ctx = getCtx();
    if (!mainBufferRef.current) return;
    if (ctx.state === "suspended") ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = mainBufferRef.current;
    src.connect(ctx.destination);
    src.start(0, offset);
    sourceRef.current = src;
    startTimeRef.current = ctx.currentTime - offset;
    pauseOffsetRef.current = offset;
    internalPlayingRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
    if (tagUrl) {
      const tryFireTag = () => { if (tagBufferRef.current) fireTag(); };
      tryFireTag();
      tagIntervalRef.current = setInterval(tryFireTag, tagIntervalSeconds * 1000);
    }
  }, [tick, tagUrl, tagIntervalSeconds, fireTag]);

  // React to global play/pause state changes
  useEffect(() => {
    if (!isThisBeat) {
      // Another beat was selected — stop our playback
      if (internalPlayingRef.current) stopSource();
      return;
    }
    if (isPlaying && !internalPlayingRef.current) {
      startPlayback(pauseOffsetRef.current);
    } else if (!isPlaying && internalPlayingRef.current) {
      const ctx = ctxRef.current;
      if (ctx) {
        const elapsed = ctx.currentTime - startTimeRef.current + pauseOffsetRef.current;
        pauseOffsetRef.current = elapsed;
      }
      stopSource();
    }
  }, [isPlaying, isThisBeat, startPlayback, stopSource]);

  // Play button handler — delegates to context
  const handleToggle = useCallback(() => {
    if (!mainBufferRef.current) return;
    setCurrentBeat(beat); // context handles toggle if same beat, or switches if different
  }, [beat, setCurrentBeat]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainBufferRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const offset = pct * mainBufferRef.current.duration;
    pauseOffsetRef.current = offset;
    setCurrentTime(offset);
    setProgress(pct * 100);
    if (isThisBeat && isPlaying) {
      stopSource();
      startPlayback(offset);
    }
  }, [isThisBeat, isPlaying, stopSource, startPlayback]);

  useEffect(() => () => { stopSource(); ctxRef.current?.close(); }, [stopSource]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const playing = isThisBeat && isPlaying;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative h-12 bg-gray-800 rounded-xl overflow-hidden cursor-pointer" onClick={seek}>
        <div className="absolute inset-0 flex items-center gap-px px-1">
          {Array.from({ length: 60 }, (_, i) => {
            const h = Math.abs(Math.sin(i * 1.7 + 1.2)) * 75 + 20;
            return <div key={i} className="flex-1 bg-blue-400/20 rounded-full" style={{ height: `${h}%` }} />;
          })}
        </div>
        <div className="absolute inset-y-0 left-0 bg-blue-600/30 transition-none pointer-events-none" style={{ width: `${progress}%` }} />
        <div className="absolute inset-0 flex items-center gap-px px-1 pointer-events-none" style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}>
          {Array.from({ length: 60 }, (_, i) => {
            const h = Math.abs(Math.sin(i * 1.7 + 1.2)) * 75 + 20;
            return <div key={i} className="flex-1 bg-blue-400 rounded-full" style={{ height: `${h}%` }} />;
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={buffering || !beat.audioFile}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center transition-colors shadow-lg shadow-blue-600/30 shrink-0"
        >
          {buffering ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="flex-1 flex justify-between text-xs text-gray-500">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
        {tagUrl && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/10 border border-blue-700/20 rounded-lg" title="Producer tag watermark active">
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            <span className="text-blue-500 text-xs font-medium">Tagged</span>
          </div>
        )}
      </div>
    </div>
  );
}
