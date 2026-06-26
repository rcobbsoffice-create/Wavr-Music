import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import MerchCard from "@/components/MerchCard";
import ProfileBeatsClient from "./ProfileBeatsClient";

async function getProducer(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      beats: { where: { status: "active" }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
      merchProducts: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
      soundKits: { where: { status: "active" }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
      collections: { where: { status: "active" }, include: { beats: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProducer(id);
  if (!p) return { title: "Producer Not Found" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  return {
    title: `${p.name} — Producer on WAVR`,
    description: p.bio ?? `Check out beats by ${p.name} on WAVR.`,
    openGraph: {
      title: p.name,
      description: p.bio ?? `Beats by ${p.name}`,
      images: p.avatar ? [p.avatar] : [],
      url: `${appUrl}/p/${id}`,
    },
    twitter: { card: "summary_large_image", title: p.name, images: p.avatar ? [p.avatar] : [] },
  };
}

const SOCIAL_ICONS: Record<string, { label: string; color: string; path: string }> = {
  twitter:    { label: "X / Twitter", color: "hover:text-white",       path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25z" },
  instagram:  { label: "Instagram",   color: "hover:text-pink-400",    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
  youtube:    { label: "YouTube",     color: "hover:text-red-400",     path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  soundcloud: { label: "SoundCloud",  color: "hover:text-orange-400",  path: "M1.175 12.225c-.016 0-.032.01-.048.01A3.174 3.174 0 000 15.39c0 1.76 1.42 3.19 3.175 3.19h14.285c1.54 0 2.79-1.26 2.79-2.79 0-1.54-1.25-2.79-2.79-2.79-.064 0-.127.004-.19.01a4.512 4.512 0 00.065-.78c0-2.48-2.01-4.49-4.49-4.49-1.39 0-2.64.63-3.49 1.63-.41-1.98-2.17-3.47-4.27-3.47-2.42 0-4.38 1.96-4.38 4.38 0 .5.09.97.27 1.41z" },
  spotify:    { label: "Spotify",     color: "hover:text-green-400",   path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" },
};

export default async function ProducerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producer = await getProducer(id);
  if (!producer || producer.role !== "producer") notFound();

  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(producer.socialLinks ?? "{}"); } catch { return {}; } })();
  const genres: string[] = (() => { try { return JSON.parse(producer.genres); } catch { return []; } })();
  const moods: string[] = (() => { try { return JSON.parse(producer.moods); } catch { return []; } })();

  const totalPlays = producer.beats.reduce((acc, b) => acc + b.plays, 0);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  const shareUrl = `${appUrl}/p/${id}`;

  return (
    <div className="min-h-screen bg-gray-950 pb-20 text-white">
      {/* Banner */}
      <div
        className="relative h-52 md:h-64 border-b border-gray-800 overflow-hidden"
        style={producer.coverImage
          ? { backgroundImage: `url(${producer.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #0d1f35 0%, #0a1628 40%, #0d2340 70%, #081420 100%)" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 via-transparent to-gray-950" />
        {!producer.coverImage && (
          <>
            {/* Subtle waveform decoration matching WAVR hero style */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.06]">
              <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
                {Array.from({ length: 120 }, (_, i) => {
                  const h = Math.abs(Math.sin(i * 1.7 + 1.2)) * 80 + 10;
                  return <rect key={i} x={i * 6.7} y={(160 - h) / 2} width="4" height={h} rx="2" fill="white" />;
                })}
              </svg>
            </div>
            {/* Teal accent glow top-left */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-5 right-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="relative -mt-16 mb-6 flex flex-col md:flex-row md:items-end gap-5">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-gray-950 shadow-2xl overflow-hidden bg-gray-800 shrink-0">
            {producer.avatar ? (
              <Image src={producer.avatar} alt={producer.name} width={144} height={144} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
                <span className="text-4xl text-white font-black">{producer.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 md:mb-2">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{producer.name}</h1>
              {producer.verified && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 border border-blue-600/40 rounded-full">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-400 text-xs font-bold">Verified</span>
                </div>
              )}
              {producer.plan === "producer_pro" && (
                <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full">PRO</span>
              )}
            </div>
            {producer.bio && <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">{producer.bio}</p>}
          </div>
          <div className="flex gap-2 md:mb-2">
            <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-sm transition-colors shadow-lg shadow-blue-600/20">Follow</button>
            <a href={`mailto:?subject=${encodeURIComponent(`Check out ${producer.name} on WAVR`)}&body=${encodeURIComponent(shareUrl)}`}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-full text-sm border border-gray-700 transition-colors">
              Contact
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mb-8 py-4 border-y border-gray-800">
          {[
            { label: "Beats", value: producer.beats.length },
            { label: "Sound Kits", value: producer.soundKits.length },
            { label: "Collections", value: producer.collections.length },
            { label: "Total Plays", value: totalPlays >= 1000 ? `${(totalPlays / 1000).toFixed(1)}k` : totalPlays },
            { label: "Followers", value: producer.followerCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center px-4">
              <span className="text-2xl font-black">{value}</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Genre + mood specialties */}
        {(genres.length > 0 || moods.length > 0) && (
          <div className="mb-8 flex flex-wrap gap-4 items-center">
            {genres.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Genres</span>
                {genres.map((g) => <span key={g} className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-700/30">{g}</span>)}
              </div>
            )}
            {moods.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Moods</span>
                {moods.map((m) => <span key={m} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">{m}</span>)}
              </div>
            )}
          </div>
        )}

        {/* Social links */}
        {Object.values(socialLinks).some(Boolean) && (
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

        <div className="space-y-16">
          {/* Beats */}
          {producer.beats.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Beats</h2>
                <span className="text-gray-500 text-sm">{producer.beats.length} available</span>
              </div>
              <ProfileBeatsClient
                beats={producer.beats.map((beat) => ({
                  ...beat,
                  producer: producer.name,
                  tags: (() => { try { return JSON.parse(beat.tags); } catch { return []; } })(),
                }))}
              />
            </section>
          )}

          {/* Sound Kits */}
          {producer.soundKits.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Sound Kits</h2>
                <Link href="/kits" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Browse all →</Link>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {producer.soundKits.map((kit) => (
                  <Link key={kit.id} href={`/kit/${kit.id}`} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all">
                    <div className="h-36 bg-gradient-to-br from-blue-900 to-gray-900 relative">
                      {kit.artwork && <Image src={kit.artwork} alt={kit.title} fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-bold text-sm truncate">{kit.title}</h3>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500 text-xs">{kit.fileCount} files</span>
                        <span className="text-blue-400 font-bold text-sm">${kit.price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {producer.collections.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Beat Packs</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {producer.collections.map((col) => (
                  <Link key={col.id} href={`/collection/${col.id}`} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all">
                    <div className="h-40 bg-gradient-to-br from-blue-950 to-gray-900 relative">
                      {col.artwork && <Image src={col.artwork} alt={col.title} fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-bold text-sm">{col.title}</p>
                        <p className="text-gray-400 text-xs">{col.beats.length} beats</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Merch */}
          {producer.merchProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Merch</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {producer.merchProducts.map((product) => <MerchCard key={product.id} item={{
                  ...product,
                  images: (() => { try { return JSON.parse(product.images); } catch { return []; } })(),
                  sizes: (() => { try { return JSON.parse(product.sizes); } catch { return []; } })(),
                  colors: (() => { try { return JSON.parse(product.colors); } catch { return []; } })(),
                }} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
