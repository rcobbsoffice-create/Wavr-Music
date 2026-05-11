import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

async function getCollection(id: string) {
  return prisma.collection.findUnique({
    where: { id },
    include: {
      producer: { select: { id: true, name: true, avatar: true, verified: true } },
      beats: {
        include: { beat: { include: { producer: { select: { name: true } } } } },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const col = await getCollection(id);
  if (!col) return { title: "Collection Not Found" };
  return {
    title: `${col.title} — Beat Pack by ${col.producer.name} | WAVR`,
    description: col.description ?? `Beat pack by ${col.producer.name}.`,
    openGraph: { title: col.title, images: col.artwork ? [col.artwork] : [] },
  };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await getCollection(id);
  if (!col || col.status !== "active") notFound();

  const tags: string[] = (() => { try { return JSON.parse(col.tags); } catch { return []; } })();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  const shareUrl = `${appUrl}/collection/${id}`;

  const beats = col.beats.map((cb) => ({
    ...cb.beat,
    tags: (() => { try { return JSON.parse(cb.beat.tags); } catch { return []; } })(),
    producer: cb.beat.producer.name,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
          <div className="w-52 h-52 shrink-0 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl">
            {col.artwork ? (
              <Image src={col.artwork} alt={col.title} width={208} height={208} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
                <svg className="w-20 h-20 text-blue-400/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-full border border-blue-700/30 uppercase">Beat Pack</span>
              {col.genre && <span className="px-2.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{col.genre}</span>}
            </div>
            <h1 className="text-4xl font-black mb-2">{col.title}</h1>
            <Link href={`/p/${col.producer.id}`} className="text-blue-400 hover:text-blue-300 font-semibold text-sm mb-4 inline-block transition-colors">
              by {col.producer.name}
            </Link>
            {col.description && <p className="text-gray-400 text-sm leading-relaxed mt-3 max-w-xl">{col.description}</p>}
            <div className="flex flex-wrap gap-3 mt-5 items-center">
              <span className="text-3xl font-black text-white">${col.price}</span>
              <span className="text-gray-500 text-sm">· {beats.length} beats included</span>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20">
                Buy Pack — ${col.price}
              </button>
              <button
                onClick={async () => { await navigator.clipboard.writeText(shareUrl); }}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors border border-gray-700"
              >
                Copy Link
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((t) => <span key={t} className="px-2.5 py-0.5 bg-gray-800 text-gray-500 text-xs rounded-full">#{t}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Beats in collection */}
        <h2 className="text-xl font-bold text-white mb-6">Beats in This Pack</h2>
        <div className="space-y-3">
          {beats.map((beat, i) => (
            <Link key={beat.id} href={`/beat/${beat.id}`} className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/40 transition-all group">
              <span className="text-gray-600 text-sm w-6 text-center font-mono">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                {beat.artwork ? <Image src={beat.artwork} alt={beat.title} width={40} height={40} className="object-cover" /> : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-800" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">{beat.title}</p>
                <p className="text-gray-500 text-xs">{beat.genre} · {beat.bpm} BPM · {beat.key}</p>
              </div>
              <div className="flex gap-2">
                {(beat.tags as string[]).slice(0, 2).map((t) => <span key={t} className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full hidden sm:block">#{t}</span>)}
              </div>
              <span className="text-blue-400 font-bold text-sm shrink-0">from ${beat.priceBasic}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
