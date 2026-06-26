import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.newsPost.findUnique({
    where: { id, published: true },
    include: { author: { select: { name: true } } },
  });
  if (!post) notFound();

  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <Link href="/news" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to News
        </Link>

        {post.image && (
          <div className="rounded-2xl overflow-hidden mb-8 h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{post.category}</span>

        <h1 className="text-4xl font-black text-white mt-5 mb-3 leading-tight">{post.title}</h1>
        <p className="text-gray-500 text-sm mb-8">
          {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {post.author.name}
        </p>

        <div className="prose prose-invert prose-gray max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>
    </div>
  );
}
