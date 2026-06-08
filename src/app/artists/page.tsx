"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Artist {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  merch: number;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/artists")
      .then(r => r.json())
      .then(d => setArtists(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.bio ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">
            Artists <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">on WAVR</span>
          </h1>
          <p className="text-gray-400">Discover independent artists building their brand on WAVR.</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search artists…"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg font-semibold mb-2">
              {search ? "No artists match your search" : "No artists yet"}
            </p>
            <p className="text-gray-600 text-sm">
              {search ? "Try a different name." : "Artists will appear here once they join WAVR."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(artist => (
              <Link key={artist.id} href={`/artists/${artist.id}`}
                className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/10 transition-all">
                {/* Avatar */}
                <div className="aspect-square bg-gradient-to-br from-blue-900 to-teal-900 overflow-hidden relative">
                  {artist.avatar ? (
                    <Image src={artist.avatar} alt={artist.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-black text-white/30">{artist.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold truncate">{artist.name}</h3>
                  {artist.bio ? (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{artist.bio}</p>
                  ) : (
                    <p className="text-gray-600 text-xs mt-1">Independent artist</p>
                  )}
                  {artist.merch > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="text-teal-400 text-xs font-semibold">{artist.merch} merch item{artist.merch !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
