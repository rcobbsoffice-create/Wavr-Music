import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company | WAVR Music",
  description: "Learn more about WAVR Music Inc. Explore our about us, careers, blog, press, and partner pages.",
};

const links = [
  { title: "About Us", href: "/about", desc: "Our mission, story, and values.", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Careers", href: "/careers", desc: "Join our team and build the future.", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { title: "News", href: "/news", desc: "Producer tips and industry news.", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l5 5v9a2 2 0 01-2 2z" },
  { title: "Press", href: "/press", desc: "Official releases and media assets.", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
  { title: "Partners", href: "/partners", desc: "Our industry ecosystem.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function CompanyPage() {
  return (
    <div className="bg-gray-950 min-h-screen text-gray-300">
      <section className="pt-32 pb-24 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-black text-white mb-6">Company</h1>
          <p className="text-xl text-gray-400">Everything about the WAVR ecosystem.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="group p-8 bg-gray-900 border border-gray-800 rounded-3xl hover:border-red-600/40 transition-all">
                <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-red-500 mb-6 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{link.title}</h2>
                <p className="text-gray-500">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
