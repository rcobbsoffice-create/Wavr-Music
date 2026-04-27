import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partners | WAVR Music Ecosystem",
  description: "Explore the WAVR Music partner ecosystem. We work with the industry's best to provide producers with elite tools and services.",
  keywords: ["music partners", "wavr ecosystem", "producer tools", "industry integrations"],
};

const partnerCategories = [
  {
    title: "Distribution",
    desc: "Seamlessly push your music to Spotify, Apple Music, and more.",
    partners: ["DistroKid", "TuneCore", "UnitedMasters"],
  },
  {
    title: "Plugins & DAW",
    desc: "Exclusive deals on the software you use to create.",
    partners: ["Output", "Arturia", "Splice"],
  },
  {
    title: "Marketing",
    desc: "Grow your fanbase with targeted promotion tools.",
    partners: ["Linktree", "SubmitHub", "Groover"],
  },
];

export default function PartnersPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Hero */}
      <section className="pt-32 pb-24 border-b border-gray-900 overflow-hidden relative">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Better <span className="text-red-600">Together</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            We partner with the industry's most innovative companies to empower independent producers.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {partnerCategories.map((cat) => (
              <div key={cat.title} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4">{cat.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{cat.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.partners.map((p) => (
                    <span key={p} className="bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-gray-700">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Become a Partner</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Are you building something for the next generation of creators? We're always looking for strategic partners to expand the WAVR ecosystem and provide more value to our producers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="mailto:partners@wavr.music" className="bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors">
                Apply for Partnership
              </a>
              <Link href="/about" className="border border-gray-700 hover:border-gray-600 text-white font-bold px-10 py-4 rounded-xl transition-colors">
                Learn About WAVR
              </Link>
            </div>
          </div>
          
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Partner Logos */}
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
