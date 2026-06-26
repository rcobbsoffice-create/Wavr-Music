"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "producer" | "artist";

const ROLES: { id: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "producer",
    label: "Producer",
    description: "I make beats and sell them to artists.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
  },
  {
    id: "artist",
    label: "Artist",
    description: "I'm a rapper, singer, or songwriter looking for beats.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(data.redirectTo);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <span className="text-3xl font-black tracking-tighter text-white">
              WAV<span className="text-blue-500">R</span>
            </span>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-white font-bold text-2xl">How will you use WAVR?</h1>
            <p className="text-gray-500 text-sm mt-2">Pick your role — you can change it later in settings.</p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 mb-6 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            {ROLES.map((role) => {
              const isSelected = selected === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelected(role.id)}
                  className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? "border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-600/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                  <div className={`${isSelected ? "text-blue-400" : "text-gray-400"}`}>
                    {role.icon}
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-base ${isSelected ? "text-white" : "text-gray-300"}`}>
                      {role.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            {loading ? "Creating your account..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
