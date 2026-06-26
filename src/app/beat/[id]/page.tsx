import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import BeatDetailClient from "./BeatDetailClient";

async function getBeat(id: string) {
  return prisma.beat.findUnique({
    where: { id },
    include: {
      producer: {
        select: { id: true, name: true, avatar: true, verified: true, bio: true, plan: true, tagAudio: true },
      },
      stems: true,
      licenses: { select: { id: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const beat = await getBeat(id);
  if (!beat) return { title: "Beat Not Found" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  return {
    title: `${beat.title} by ${beat.producer.name} — WAVR`,
    description: beat.description ?? `${beat.genre} beat at ${beat.bpm} BPM in ${beat.key}. By ${beat.producer.name}.`,
    openGraph: {
      title: `${beat.title} — ${beat.producer.name}`,
      description: beat.description ?? `${beat.genre} · ${beat.bpm} BPM · ${beat.key}`,
      images: beat.artwork ? [beat.artwork] : [],
      url: `${appUrl}/beat/${id}`,
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title: `${beat.title} by ${beat.producer.name}`,
      description: beat.description ?? `${beat.genre} · ${beat.bpm} BPM · ${beat.key}`,
      images: beat.artwork ? [beat.artwork] : [],
    },
  };
}

const LICENSE_TIERS = [
  {
    key: "basic",
    label: "Basic Lease",
    priceKey: "priceBasic" as const,
    color: "border-gray-700 bg-gray-900/50",
    badge: "bg-gray-700 text-gray-200",
    includes: [
      "MP3 file (320kbps)",
      "Non-exclusive rights",
      "Up to 10,000 streams",
      "YouTube monetization",
      "Must credit producer",
    ],
    notIncluded: ["WAV file", "Stems", "Radio broadcasting", "Unlimited distribution"],
  },
  {
    key: "premium",
    label: "Premium Lease",
    priceKey: "pricePremium" as const,
    color: "border-blue-700/60 bg-blue-950/30",
    badge: "bg-blue-600 text-white",
    popular: true,
    includes: [
      "WAV + MP3 files",
      "Non-exclusive rights",
      "Up to 500,000 streams",
      "Radio broadcasting",
      "Commercial use",
      "Must credit producer",
    ],
    notIncluded: ["Stems", "Unlimited distribution"],
  },
  {
    key: "exclusive",
    label: "Exclusive Rights",
    priceKey: "priceExclusive" as const,
    color: "border-amber-700/60 bg-amber-950/20",
    badge: "bg-amber-500 text-black",
    includes: [
      "WAV + MP3 + Stems",
      "Full exclusive ownership",
      "Unlimited distribution",
      "Unlimited streams",
      "Radio + TV + Film sync",
      "No credit required",
      "Beat removed from store",
    ],
    notIncluded: [],
  },
];

const SYNC_CATEGORIES = ["Film & TV", "YouTube", "Podcasts", "Commercials", "Video Games", "Live Performances"];

export default async function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beat = await getBeat(id);

  if (!beat || beat.status === "draft") notFound();

  const tags: string[] = (() => {
    try { return JSON.parse(beat.tags); } catch { return []; }
  })();

  const allowedUses: string[] = (() => {
    try { return JSON.parse(beat.allowedUses ?? "[]"); } catch { return []; }
  })();

  const stemsReady = beat.stems.some((s) => s.status === "ready");
  const stemCount = beat.stems.filter((s) => s.status === "ready").length;
  const totalLicenses = beat.licenses.length;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  const shareUrl = `${appUrl}/beat/${id}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative border-b border-gray-800">
        {beat.artwork && (
          <div className="absolute inset-0 overflow-hidden">
            <Image src={beat.artwork} alt="" fill className="object-cover opacity-10 blur-2xl scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />
          </div>
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Artwork */}
            <div className="w-56 h-56 shrink-0 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl shadow-black/50 mx-auto md:mx-0">
              {beat.artwork ? (
                <Image src={beat.artwork} alt={beat.title} width={224} height={224} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
                  <svg className="w-20 h-20 text-blue-400/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-700/30">
                  {beat.genre}
                </span>
                {beat.status === "exclusive_sold" && (
                  <span className="px-2.5 py-0.5 bg-red-900/40 text-red-400 text-xs font-bold rounded-full border border-red-700/30">
                    Exclusive Sold
                  </span>
                )}
                {beat.featured && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-600/30">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">{beat.title}</h1>

              <Link href={`/p/${beat.producer.id}`} className="inline-flex items-center gap-2.5 mb-6 group">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-700/30 overflow-hidden flex items-center justify-center">
                  {beat.producer.avatar ? (
                    <Image src={beat.producer.avatar} alt={beat.producer.name} width={32} height={32} className="object-cover" />
                  ) : (
                    <span className="text-blue-400 font-bold text-sm">{beat.producer.name[0]}</span>
                  )}
                </div>
                <span className="text-blue-400 group-hover:text-blue-300 font-semibold transition-colors">
                  {beat.producer.name}
                </span>
                {beat.producer.verified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </Link>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm mb-6">
                {[
                  { label: "BPM", value: beat.bpm },
                  { label: "Key", value: beat.key },
                  { label: "Mood", value: beat.mood ?? "—" },
                  { label: "Plays", value: beat.plays.toLocaleString() },
                  { label: "Licenses", value: totalLicenses },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
                    <span className="text-white font-bold mt-0.5">{value}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left column — player, description, sync info */}
          <div className="lg:col-span-2 space-y-8">

            {/* Client-side audio player + purchase */}
            <BeatDetailClient
              beatId={beat.id}
              title={beat.title}
              producer={beat.producer.name}
              producerId={beat.producer.id}
              audioUrl={beat.mp3Preview ?? beat.audioFile ?? null}
              artwork={beat.artwork ?? null}
              tagUrl={beat.producer.tagAudio ?? null}
              priceBasic={beat.priceBasic}
              pricePremium={beat.pricePremium}
              priceExclusive={beat.priceExclusive}
              shareUrl={shareUrl}
              stemsReady={stemsReady}
              status={beat.status}
              plays={beat.plays}
              licenseCount={totalLicenses}
            />

            {/* Description */}
            {beat.description && (
              <section>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                  </svg>
                  About This Beat
                </h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-line">{beat.description}</p>
              </section>
            )}

            {/* Sync licensing */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Sync Licensing
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                This beat is available for sync placement in visual media. Clear your sync license before placement to avoid copyright claims.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYNC_CATEGORIES.map((cat) => {
                  const allowed = allowedUses.length === 0 || allowedUses.some((u) => cat.toLowerCase().includes(u.toLowerCase()) || u.toLowerCase().includes(cat.toLowerCase().split(" ")[0]));
                  return (
                    <div key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${allowed ? "bg-green-900/20 border border-green-800/30 text-green-400" : "bg-gray-800/50 border border-gray-700/30 text-gray-500"}`}>
                      <span className={allowed ? "text-green-400" : "text-gray-600"}>
                        {allowed ? "✓" : "✗"}
                      </span>
                      {cat}
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-600 text-xs mt-4">
                Premium and Exclusive licenses include sync rights. Basic lease is limited to online non-commercial use only. Contact the producer for custom sync deals.
              </p>
            </section>

            {/* Stems availability */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Stems & Track Outs
              </h2>
              {stemsReady ? (
                <div>
                  <p className="text-green-400 text-sm font-medium mb-3">✓ {stemCount} stems available with Premium or Exclusive license</p>
                  <div className="flex flex-wrap gap-2">
                    {beat.stems.filter((s) => s.status === "ready").map((s) => (
                      <span key={s.id} className="px-3 py-1 bg-green-900/20 text-green-400 text-xs rounded-full border border-green-800/30 capitalize">
                        {s.type}
                      </span>
                    ))}
                  </div>
                </div>
              ) : beat.stemZip ? (
                <p className="text-blue-400 text-sm">✓ Stem pack included with Premium / Exclusive license</p>
              ) : (
                <p className="text-gray-500 text-sm">Stems not available for this beat. Contact the producer for custom stem exports.</p>
              )}
            </section>
          </div>

          {/* Right column — license tiers */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">License Options</h2>
            {LICENSE_TIERS.map((tier) => (
              <div key={tier.key} className={`relative rounded-2xl border p-5 ${tier.color} transition-all`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${tier.badge}`}>{tier.label}</span>
                  <span className="text-2xl font-black text-white">${beat[tier.priceKey]}</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                  {tier.notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="mt-0.5 shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Producer card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-6">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Producer</p>
              <Link href={`/p/${beat.producer.id}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 overflow-hidden flex items-center justify-center border border-blue-700/30">
                  {beat.producer.avatar ? (
                    <Image src={beat.producer.avatar} alt={beat.producer.name} width={40} height={40} className="object-cover" />
                  ) : (
                    <span className="text-blue-400 font-bold">{beat.producer.name[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{beat.producer.name}</span>
                    {beat.producer.verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">View full profile →</p>
                </div>
              </Link>
              {beat.producer.bio && (
                <p className="text-gray-500 text-xs mt-3 leading-relaxed line-clamp-3">{beat.producer.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
