import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | WAVR Music",
  description: "Learn about WAVR Music, the premier beat marketplace for independent producers. Our mission is to empower creators and own their sound.",
  keywords: ["about wavr", "music marketplace", "independent producers", "beat selling platform"],
};

export default function AboutPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden border-b border-gray-900">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Our Mission: Empowering <span className="text-red-600">Creators</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            WAVR was built by producers, for producers. We believe in a world where independent artists have the tools, the tech, and the freedom to own their career.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid gap-16">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">The WAVR Story</h2>
              <p className="text-lg leading-relaxed mb-6">
                Founded in 2024, WAVR emerged from a simple observation: the music industry is changing, but the tools for producers are stuck in the past. We saw talented creators struggling with opaque licensing, high fees, and fragmented distribution.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                We set out to build more than just a marketplace. We built an ecosystem. A place where you can sell your beats, launch a merch line, and analyze your growth—all without giving up your rights or your profits.
              </p>
            </div>

            {/* Founder Bio */}
            <div className="bg-gray-900 border border-gray-800 p-10 rounded-3xl">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-white mb-6">Meet the Founder</h2>
                <h3 className="text-xl font-bold text-red-600 mb-4">Rondell Cobbs II · Music Producer</h3>
                <p className="text-lg leading-relaxed text-gray-300 mb-6">
                  WAVR was founded by **Rondell Cobbs II**, a seasoned Music Producer who spent **7 years behind the scenes at Cash Money Records**. 
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Having witnessed firsthand the inner workings of one of the most successful labels in music history, Rondell saw the gap between major label resources and independent producer tools. He built WAVR to bring that "behind the scenes" industry power directly to every producer, allowing them to scale their business with the same precision as the giants.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Independence First</h3>
                <p className="text-gray-400">
                  We don't take a cut of your creativity. Our goal is to provide the infrastructure so you can focus on the music.
                </p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Innovation Driven</h3>
                <p className="text-gray-400">
                  From AI-powered stem separation to instant license generation, we bring cutting-edge tech to your workflow.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <strong className="text-white">Transparency:</strong> No hidden fees, no confusing contracts. You always know where your money is.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <strong className="text-white">Ownership:</strong> You own your masters, your brand, and your data. Always.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <strong className="text-white">Community:</strong> We grow when our producers grow. We're in this together.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900/30 border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to join the movement?</h2>
          <div className="flex justify-center gap-4">
            <Link href="/signup" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Create Account
            </Link>
            <Link href="/marketplace" className="border border-gray-700 hover:border-gray-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Browse Beats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
