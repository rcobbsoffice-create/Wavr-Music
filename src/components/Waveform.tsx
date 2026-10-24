"use client";

/**
 * Decorative waveform bars. The shape is derived from `seed` (e.g. a beat id),
 * so each beat keeps the same look across renders. `progress` (0–1) lights up
 * the bars that have played. Optional onSeek makes it a scrubber.
 */
function seedNumber(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 100;
}

export default function Waveform({
  seed,
  bars = 60,
  progress = 0,
  className = "",
  onSeek,
  label,
}: {
  seed: string;
  bars?: number;
  progress?: number;
  className?: string;
  onSeek?: (fraction: number) => void;
  label?: string;
}) {
  const s = seedNumber(seed);
  const heights = Array.from({ length: bars }, (_, i) => {
    const v = Math.abs(Math.sin(i * 0.37 + s) * 0.6 + Math.sin(i * 1.13 + s * 2) * 0.4);
    return 18 + v * 82;
  });

  const content = heights.map((h, i) => (
    <span
      key={i}
      className={`flex-1 min-w-[2px] rounded-sm transition-colors ${i / bars < progress ? "bg-wavr-lime" : "bg-wavr-edge"}`}
      style={{ height: `${h}%` }}
    />
  ));

  if (!onSeek) {
    return (
      <div aria-hidden="true" className={`flex items-center gap-[3px] ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label ?? "Seek"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className={`flex items-center gap-[2px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-wavr-lime rounded ${className}`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
      }}
    >
      {content}
    </div>
  );
}
