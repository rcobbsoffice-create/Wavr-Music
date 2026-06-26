"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface SoundKit {
  id: string;
  title: string;
  description: string | null;
  artwork: string | null;
  previewUrl: string | null;
  price: number;
  genre: string | null;
  tags: string[];
  fileCount: number;
  downloads: number;
  featured: boolean;
  producer: { id: string; name: string; avatar: string | null; verified: boolean };
}

export default function SoundKitsPage() {
  const [kits, setKits] = useState<SoundKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/sound-kits")
      .then((r) => r.json())
      .then((data) => setKits(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = kits.filter((k) =>
    !search || k.title.toLowerCase().includes(search.toLowerCase()) || k.genre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Sound Kits</h1>
          <p className="text-gray-400">One-shots, loops, drum kits and sample packs from top producers.</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search kits by name or genre…"
            className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🎛</div>
            <p className="text-lg font-medium">No sound kits yet</p>
            <p className="text-sm mt-2">Check back soon — producers are uploading packs.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((kit) => (
              <Link key={kit.id} href={`/kit/${kit.id}`} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-900/20">
                <div className="relative h-48 bg-gradient-to-br from-blue-900 via-gray-900 to-black">
                  {kit.artwork ? (
                    <Image src={kit.artwork} alt={kit.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-blue-400/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12H9v-2h4v2zm4-4H9V8h8v2z" />
                      </svg>
                    </div>
                  )}
                  {kit.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-blue-600 text-xs text-white px-2 py-0.5 rounded-full font-bold">Featured</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    {kit.genre && <span className="bg-black/60 text-xs text-gray-300 px-2 py-0.5 rounded-full">{kit.genre}</span>}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-sm truncate mb-1">{kit.title}</h3>
                  <p className="text-blue-400 text-xs">by {kit.producer.name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2 text-xs text-gray-500">
                      {kit.fileCount > 0 && <span>{kit.fileCount} files</span>}
                      <span>{kit.downloads} downloads</span>
                    </div>
                    <span className="text-white font-black text-sm">${kit.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
