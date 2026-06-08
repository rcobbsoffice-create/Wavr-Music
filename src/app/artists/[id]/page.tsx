import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import MerchCard from "@/components/MerchCard";

async function getArtist(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      merchProducts: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return { title: "Artist Not Found" };
  return {
    title: `${artist.name} — Artist on WAVR`,
    description: artist.bio ?? `Check out ${artist.name} on WAVR.`,
    openGraph: {
      title: artist.name,
      description: artist.bio ?? `Artist on WAVR`,
      images: artist.avatar ? [artist.avatar] : [],
    },
  };
}

const SOCIAL_ICONS: Record<string, { label: string; color: string; path: string }> = {
  twitter:    { label: "X / Twitter", color: "hover:text-white",       path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25z" },
  instagram:  { label: "Instagram",   color: "hover:text-pink-400",    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
  youtube:    { label: "YouTube",     color: "hover:text-red-400",     path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  soundcloud: { label: "SoundCloud",  color: "hover:text-orange-400",  path: "M1.175 12.225c-.016 0-.032.01-.048.01A3.174 3.174 0 000 15.39c0 1.76 1.42 3.19 3.175 3.19h14.285c1.54 0 2.79-1.26 2.79-2.79 0-1.54-1.25-2.79-2.79-2.79-.064 0-.127.004-.19.01a4.512 4.512 0 00.065-.78c0-2.48-2.01-4.49-4.49-4.49-1.39 0-2.64.63-3.49 1.63-.41-1.98-2.17-3.47-4.27-3.47-2.42 0-4.38 1.96-4.38 4.38 0 .5.09.97.27 1.41z" },
  spotify:    { label: "Spotify",     color: "hover:text-green-400",   path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" },
  website:    { label: "Website",     color: "hover:text-blue-400",    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
};

export default async function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist || artist.role !== "artist") notFound();

  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(artist.socialLinks ?? "{}"); } catch { return {}; } })();
  const hasSocial = Object.values(socialLinks).some(Boolean);

  return (
    <div className="min-h-screen bg-gray-950 pb-20 text-white">
      {/* Cover */}
      <div
        className="relative h-52 md:h-64 border-b border-gray-800 overflow-hidden"
        style={artist.coverImage
          ? { backgroundImage: `url(${artist.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #0d2535 0%, #0a1628 40%, #0d2340 70%, #081420 100%)" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 via-transparent to-gray-950" />
        {!artist.coverImage && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.05]">
            <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
              {Array.from({ length: 120 }, (_, i) => {
                const h = Math.abs(Math.sin(i * 1.7 + 1.2)) * 80 + 10;
                return <rect key={i} x={i * 6.7} y={(160 - h) / 2} width="4" height={h} rx="2" fill="white" />;
              })}
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="relative -mt-16 mb-6 flex flex-col md:flex-row md:items-end gap-5">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-gray-950 shadow-2xl overflow-hidden bg-gray-800 shrink-0">
            {artist.avatar ? (
              <Image src={artist.avatar} alt={artist.name} width={144} height={144} className="object-cover w-full h-full" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-600 to-blue-900">
                <span className="text-4xl text-white font-black">{artist.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 md:mb-2">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{artist.name}</h1>
              <span className="px-2.5 py-1 bg-teal-600/20 border border-teal-600/40 text-teal-400 text-xs font-bold rounded-full uppercase tracking-wider">Artist</span>
            </div>
            {artist.bio && <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">{artist.bio}</p>}
          </div>
          <div className="flex gap-2 md:mb-2 shrink-0">
            <Link href="/marketplace"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-sm transition-colors shadow-lg shadow-blue-600/20">
              Browse Beats
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mb-8 py-4 border-y border-gray-800">
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-black">{artist.merchProducts.length}</span>
            <span className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">Merch Items</span>
          </div>
        </div>

        {/* Social links */}
        {hasSocial && (
          <div className="mb-8 flex flex-wrap gap-3">
            {(Object.entries(socialLinks) as [string, string][]).filter(([, v]) => v).map(([platform, url]) => {
              const meta = SOCIAL_ICONS[platform];
              if (!meta) return null;
              return (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full text-gray-400 text-sm font-medium transition-colors ${meta.color}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={meta.path} /></svg>
                  {meta.label}
                </a>
              );
            })}
          </div>
        )}

        {/* Merch */}
        {artist.merchProducts.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold mb-6">Merch</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {artist.merchProducts.map((product) => (
                <MerchCard key={product.id} item={{
                  ...product,
                  images: (() => { try { return JSON.parse(product.images); } catch { return []; } })(),
                  sizes: (() => { try { return JSON.parse(product.sizes); } catch { return []; } })(),
                  colors: (() => { try { return JSON.parse(product.colors); } catch { return []; } })(),
                }} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <p className="text-gray-500">No merch yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
