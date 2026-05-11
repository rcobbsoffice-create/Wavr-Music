"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props { kitId: string; title: string; producer: string; previewUrl: string | null; price: number; shareUrl: string; }

export default function KitDetailClient({ kitId, title, producer, previewUrl, price, shareUrl }: Props) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !previewUrl) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const handleBuy = async () => {
    setError("");
    setPurchasing(true);
    try {
      const res = await fetch("/api/checkout/kit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kitId }) });
      const data = await res.json();
      if (!res.ok) { if (res.status === 401) { router.push("/login"); return; } setError(data.error ?? "Checkout failed"); return; }
      window.location.href = data.url;
    } catch { setError("Something went wrong."); } finally { setPurchasing(false); }
  };

  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-5">
      {previewUrl && <audio ref={audioRef} src={previewUrl} preload="metadata" />}
      {previewUrl && (
        <button onClick={togglePlay} className="w-full flex items-center justify-center gap-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 text-white font-semibold transition-colors">
          {playing ? (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> Pause Preview</>
          ) : (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Preview Kit</>
          )}
        </button>
      )}
      <div className="text-center">
        <div className="text-4xl font-black text-white mb-1">${price}</div>
        <p className="text-gray-500 text-xs">One-time purchase · Instant download</p>
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button onClick={handleBuy} disabled={purchasing} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
        {purchasing ? "Redirecting…" : `Buy Kit — $${price}`}
      </button>
      <div className="flex gap-2">
        <button onClick={copyLink} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold rounded-xl border border-gray-700 transition-colors">
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
        <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${title}" by ${producer} on WAVR`)}&url=${encodeURIComponent(shareUrl)}`, "_blank")}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-semibold rounded-xl border border-gray-700 transition-colors">
          Share on X
        </button>
      </div>
      <ul className="space-y-2 text-xs text-gray-400">
        {["Instant ZIP download", "Royalty-free for licensed use", "WAV files included", "Works in all DAWs"].map((f) => (
          <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>
        ))}
      </ul>
    </div>
  );
}
