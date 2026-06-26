import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import KitDetailClient from "./KitDetailClient";

async function getKit(id: string) {
  return prisma.soundKit.findUnique({
    where: { id },
    include: { producer: { select: { id: true, name: true, avatar: true, verified: true, bio: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const kit = await getKit(id);
  if (!kit) return { title: "Kit Not Found" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";
  return {
    title: `${kit.title} — Sound Kit by ${kit.producer.name} | WAVR`,
    description: kit.description ?? `Sound kit by ${kit.producer.name}. ${kit.fileCount} files · $${kit.price}`,
    openGraph: {
      title: `${kit.title} Sound Kit`,
      description: kit.description ?? `By ${kit.producer.name}`,
      images: kit.artwork ? [kit.artwork] : [],
      url: `${appUrl}/kit/${id}`,
    },
    twitter: { card: "summary_large_image", title: kit.title, images: kit.artwork ? [kit.artwork] : [] },
  };
}

export default async function KitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = await getKit(id);
  if (!kit || kit.status !== "active") notFound();

  const tags: string[] = (() => { try { return JSON.parse(kit.tags); } catch { return []; } })();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wavr-music.vercel.app";

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Left */}
          <div className="md:col-span-3 space-y-8">
            {/* Artwork + info */}
            <div className="flex gap-6 items-start">
              <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-xl">
                {kit.artwork ? (
                  <Image src={kit.artwork} alt={kit.title} width={192} height={192} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
                    <svg className="w-16 h-16 text-blue-400/40" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {kit.genre && <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-full border border-blue-700/30 uppercase">{kit.genre}</span>}
                  {kit.featured && <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-600/30">Featured</span>}
                </div>
                <h1 className="text-3xl font-black mb-2">{kit.title}</h1>
                <Link href={`/p/${kit.producer.id}`} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm mb-4 transition-colors">
                  by {kit.producer.name}
                  {kit.producer.verified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
                <div className="flex flex-wrap gap-3 text-sm">
                  {kit.fileCount > 0 && <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-center"><div className="text-gray-500 text-xs">Files</div><div className="text-white font-bold">{kit.fileCount}</div></div>}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-center"><div className="text-gray-500 text-xs">Downloads</div><div className="text-white font-bold">{kit.downloads}</div></div>
                </div>
              </div>
            </div>

            {/* Description */}
            {kit.description && (
              <div>
                <h2 className="text-lg font-bold mb-2">About This Kit</h2>
                <p className="text-gray-400 leading-relaxed">{kit.description}</p>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => <span key={t} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">#{t}</span>)}
              </div>
            )}
          </div>

          {/* Right — purchase */}
          <div className="md:col-span-2">
            <KitDetailClient
              kitId={kit.id}
              title={kit.title}
              producer={kit.producer.name}
              previewUrl={kit.previewUrl}
              price={kit.price}
              shareUrl={`${appUrl}/kit/${kit.id}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
