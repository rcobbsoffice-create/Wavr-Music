import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Careers | Join the WAVR Team",
  description: "Join WAVR Music and help build the future of the music industry. View our open positions in engineering, design, and marketing.",
  keywords: ["music tech jobs", "wavr careers", "work at wavr", "engineering jobs music"],
};

const positions = [
  {
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote / Hybrid",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Artist Relations Manager",
    department: "Marketing",
    location: "New York, NY",
    type: "Full-time",
  },
  {
    title: "Customer Support Lead",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
  },
];

export default function CareersPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-gray-900">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Build the Future of <span className="text-red-600">Sound</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            We're a team of musicians, engineers, and dreamers dedicated to giving power back to creators. Join us.
          </p>
        </div>
      </section>

      {/* Why WAVR */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Work at WAVR?</h2>
            <p className="text-gray-400">We care about our people as much as our producers.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center text-red-400 mx-auto mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-3">Flexible Work</h3>
              <p className="text-sm text-gray-500">Work from where you're most creative. We offer remote and hybrid options across all teams.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center text-red-400 mx-auto mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r-.078-.044a11.952 11.952 0 01-4.505-6.296m4.505 6.296c.777-.394 1.456-.914 2.107-1.539m2.4-5.121a9.976 9.976 0 001.242-4.7" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-3">Total Wellness</h3>
              <p className="text-sm text-gray-500">Comprehensive health, dental, and vision insurance, plus mental health support and fitness stipends.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center text-red-400 mx-auto mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-3">Equity & Growth</h3>
              <p className="text-sm text-gray-500">Stock options for every employee. We want you to own a piece of the sound you're building.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-20 bg-gray-900/20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-10">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((pos) => (
              <div key={pos.title} className="group bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-red-600/40 transition-all">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-500 transition-colors">{pos.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>{pos.department}</span>
                    <span>•</span>
                    <span>{pos.location}</span>
                    <span>•</span>
                    <span>{pos.type}</span>
                  </div>
                </div>
                <button className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-8 border border-dashed border-gray-800 rounded-2xl text-center">
            <h3 className="text-white font-bold mb-2">Don't see a fit?</h3>
            <p className="text-gray-500 text-sm mb-6">We're always looking for talented individuals. Send us your resume anyway!</p>
            <a href="mailto:careers@wavr.music" className="text-red-600 font-bold hover:underline">
              careers@wavr.music
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
