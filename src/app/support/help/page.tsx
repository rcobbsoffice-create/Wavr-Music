import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center | WAVR Music Support",
  description: "Search our knowledge base for answers to frequently asked questions about selling beats, licensing, and merch on WAVR.",
};

const categories = [
  {
    title: "Getting Started",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    articles: [
      "Setting up your producer profile",
      "How to upload your first beat",
      "Understanding the WAVR dashboard",
    ],
  },
  {
    title: "Selling & Licensing",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r-.078-.044a11.952 11.952 0 01-4.505-6.296m4.505 6.296c.777-.394 1.456-.914 2.107-1.539m2.4-5.121a9.976 9.976 0 001.242-4.7",
    articles: [
      "Difference between Basic and Exclusive licenses",
      "How to set your beat prices",
      "Managing your collaborator splits",
    ],
  },
  {
    title: "Payments & Payouts",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    articles: [
      "When do I get paid?",
      "Setting up your Stripe Connect account",
      "Understanding transaction fees",
    ],
  },
  {
    title: "Merch & Fulfillment",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    articles: [
      "How to design your first merch product",
      "Shipping times and tracking",
      "Handling merch returns and refunds",
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Search Hero */}
      <section className="bg-gray-950 pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">How can we help?</h1>
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for articles, topics, or keywords..."
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 pl-14 text-white focus:outline-none focus:ring-2 focus:ring-red-600 shadow-xl transition-all"
            />
            <svg className="w-6 h-6 text-gray-500 absolute left-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Popular: <span className="text-red-500 cursor-pointer hover:underline">Payouts</span>, <span className="text-red-500 cursor-pointer hover:underline">Exclusive Licenses</span>, <span className="text-red-500 cursor-pointer hover:underline">Uploading Stems</span>
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat) => (
              <div key={cat.title} className="flex flex-col">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cat.icon} />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">{cat.title}</h2>
                <ul className="space-y-3">
                  {cat.articles.map((art) => (
                    <li key={art}>
                      <Link href="#" className="text-gray-500 hover:text-red-500 text-sm transition-colors">
                        {art}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="#" className="mt-6 text-xs font-bold text-white uppercase tracking-widest hover:text-red-500 transition-colors">
                  View All →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help? */}
      <section className="py-20 bg-gray-900/30 border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Still need help?</h2>
          <p className="text-gray-400 mb-8">Our support team is available 24/7 to help with technical issues.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/support" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Open a Ticket
            </Link>
            <Link href="/support/contact" className="border border-gray-700 hover:border-gray-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
