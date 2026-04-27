import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "News | WAVR Music Insights",
  description: "Read the latest news, producer tips, and industry insights from the WAVR team.",
  keywords: ["music news", "wavr news", "music industry updates"],
};

const posts = [
  {
    id: 1,
    title: "How to Scale Your Beat Sales in 2024",
    excerpt: "Learn the 5 key strategies that top producers are using to reach 6-figure earnings this year.",
    category: "Strategy",
    date: "April 15, 2024",
    author: "Alex Rivera",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Mastering the Art of Collaborations",
    excerpt: "Why split sheets and collaborator networks are your secret weapon for growth.",
    category: "Production",
    date: "April 10, 2024",
    author: "Marcus J.",
    image: "https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Understanding Sync Licensing for Producers",
    excerpt: "A deep dive into how to get your beats in movies, TV shows, and commercials.",
    category: "Industry",
    date: "April 02, 2024",
    author: "Sarah Chen",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
  },
];

export default function NewsPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Hero */}
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            WAVR <span className="text-red-600">News</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Industry news, product updates, and producer insights.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-600/40 transition-all flex flex-col">
                <div className="relative h-48 overflow-hidden">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-gray-500 mb-2">{post.date} · {post.author}</div>
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <Link href={`/news/${post.id}`} className="text-white font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                    Read More <span className="text-red-500">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-24 bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Get the latest news and WAVR updates delivered straight to your inbox.
            </p>
            <form className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
