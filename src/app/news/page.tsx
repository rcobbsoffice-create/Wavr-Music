"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image?: string | null;
  authorName: string;
  createdAt: string;
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            WAVR <span className="text-blue-500">News</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Industry news, product updates, and producer insights.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-800" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-1/3" />
                    <div className="h-6 bg-gray-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No news posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-900 to-gray-900">
                    {post.image && (
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {post.authorName}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                    <Link href={`/news/${post.id}`} className="text-white font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      Read More <span className="text-blue-400">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-24 bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Get the latest news and WAVR updates delivered straight to your inbox.
            </p>
            <form className="max-w-md mx-auto flex gap-3">
              <input type="email" placeholder="you@email.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
