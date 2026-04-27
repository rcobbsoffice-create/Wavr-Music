import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Press | WAVR Music Media Assets",
  description: "Official press releases, media assets, and brand guidelines for WAVR Music. Contact our media relations team for inquiries.",
  keywords: ["wavr press", "media assets", "music platform news", "brand guidelines"],
};

const releases = [
  {
    date: "April 20, 2024",
    title: "WAVR Music Surpasses 50,000 Independent Producers",
    link: "#",
  },
  {
    date: "March 12, 2024",
    title: "WAVR Announces New AI-Powered Stem Separation Tools",
    link: "#",
  },
  {
    date: "February 05, 2024",
    title: "WAVR Partners with Global Logistics to Launch On-Demand Merch",
    link: "#",
  },
];

export default function PressPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Hero */}
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Press & <span className="text-red-600">Media</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Resources for journalists, creators, and partners.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">About WAVR</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                WAVR is the all-in-one platform for independent music producers to sell beats, manage licensing, launch merch lines, and track career analytics. Founded in 2024, our mission is to empower the next generation of music creators through better technology and transparent ownership.
              </p>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-black text-white">50K+</p>
                  <p className="text-xs text-gray-600 uppercase tracking-widest">Producers</p>
                </div>
                <div className="w-px h-10 bg-gray-800" />
                <div>
                  <p className="text-2xl font-black text-white">$12M+</p>
                  <p className="text-xs text-gray-600 uppercase tracking-widest">Paid Out</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Media Contact</h3>
              <p className="text-sm text-gray-400 mb-6">For all media inquiries, interview requests, or high-res assets, please contact our team.</p>
              <a href="mailto:press@wavr.music" className="inline-block bg-white text-black font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                Contact Press Team
              </a>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Latest Press Releases</h2>
            <div className="space-y-4">
              {releases.map((release) => (
                <Link key={release.title} href={release.link} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-red-600/40 transition-all group">
                  <span className="text-white font-semibold group-hover:text-red-500 transition-colors">{release.title}</span>
                  <span className="text-xs text-gray-600 mt-2 sm:mt-0">{release.date}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Brand Assets</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { title: "Logo Pack", size: "4.2 MB", format: "SVG, PNG" },
                { title: "Founder Photos", size: "12.8 MB", format: "JPG" },
                { title: "Product Screens", size: "18.5 MB", format: "PNG" },
              ].map((asset) => (
                <div key={asset.title} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl text-center">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{asset.title}</h3>
                  <p className="text-[10px] text-gray-600 mb-4">{asset.format} · {asset.size}</p>
                  <button className="text-red-500 text-xs font-bold hover:underline">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
