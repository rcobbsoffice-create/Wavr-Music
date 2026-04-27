import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <span className="text-2xl font-black tracking-tighter text-red-600">
                WAVR
              </span>
            </Link>
            <p className="mt-3 text-gray-500 text-sm leading-relaxed">
              The premier beat marketplace for independent producers. Sell
              beats, license your music, and grow your income — all in one place.
            </p>
            <div className="flex gap-4 mt-5">
              <a
                href="#"
                className="text-gray-600 hover:text-red-400 text-sm font-medium transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-red-400 text-sm font-medium transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-red-400 text-sm font-medium transition-colors"
              >
                TikTok
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-red-400 text-sm font-medium transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-3">
              {["Marketplace", "Merch Store", "Analytics", "Dashboard"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase().replace(" ", "")}`}
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              {[
                { name: "About Us", href: "/about" },
                { name: "Careers", href: "/careers" },
                { name: "News", href: "/news" },
                { name: "Press", href: "/press" },
                { name: "Partners", href: "/partners" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-3">
              {[
                { name: "Help Center", href: "/support/help" },
                { name: "Contact Us", href: "/support/contact" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Cookie Policy", href: "/cookies" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} WAVR Music Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">Trusted by</span>
            <span className="text-red-500 font-semibold text-sm">50,000+</span>
            <span className="text-gray-600 text-xs">independent artists</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
