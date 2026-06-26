"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Collection {
  id: string; title: string; description: string | null; artwork: string | null; price: number;
  genre: string | null; tags: string[]; beatCount: number; featured: boolean;
  producer: { id: string; name: string; avatar: string | null; verified: boolean };
}

export default function CollectionsPage() {
  const [cols, setCols] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then((d) => setCols(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Beat Packs & Collections</h1>
          <p className="text-gray-400">Curated sets of beats for artists who want a cohesive sound.</p>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : cols.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-lg font-medium">No collections yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cols.map((col) => (
              <Link key={col.id} href={`/collection/${col.id}`} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-900/20">
                <div className="relative h-52 bg-gradient-to-br from-blue-950 to-gray-900">
                  {col.artwork && <Image src={col.artwork} alt={col.title} fill className="object-cover opacity-75 group-hover:opacity-100 transition-opacity" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                  {col.featured && <div className="absolute top-3 right-3"><span className="bg-blue-600 text-xs text-white px-2 py-0.5 rounded-full font-bold">Featured</span></div>}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-black text-lg leading-tight">{col.title}</h3>
                    <p className="text-blue-400 text-sm">by {col.producer.name}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{col.beatCount} beats</span>
                    {col.genre && <span>· {col.genre}</span>}
                  </div>
                  <span className="text-white font-black">${col.price}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
