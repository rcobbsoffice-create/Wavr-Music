"use client";

import Link from "next/link";

const features = [
  {
    iconPath: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
    title: "Beat Marketplace",
    desc: "List your beats with flexible licensing — basic, premium, and exclusive. Set your own prices and keep up to 100% of earnings.",
    color: "from-red-600/20 to-red-900/5 border-red-700/30",
    accent: "text-red-400",
  },
  {
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Flexible Licensing",
    desc: "Offer basic, premium, and exclusive licenses. Buyers get instant downloads and you keep control of your catalog.",
    color: "from-gray-600/20 to-gray-900/5 border-gray-700/30",
    accent: "text-gray-400",
  },
  {
    iconPath: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    title: "Merch Store",
    desc: "Launch your own merch line with zero inventory. We handle printing, shipping, and fulfillment.",
    color: "from-red-600/20 to-red-900/5 border-red-700/30",
    accent: "text-red-400",
  },
  {
    iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Advanced Analytics",
    desc: "Deep insights into beat sales, revenue, audience demographics, and geographic data in real-time.",
    color: "from-gray-600/20 to-gray-900/5 border-gray-700/30",
    accent: "text-gray-400",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with the basics",
    features: [
      "Up to 5 beat listings",
      "Basic beat marketplace listing",
      "Basic & premium license sales",
      "Basic analytics",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For serious producers",
    features: [
      "Unlimited beat listings",
      "Priority marketplace placement",
      "Basic, premium & exclusive licenses",
      "Advanced analytics & insights",
      "Merch store (5 products)",
      "Custom producer profile",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Label",
    price: "$29.99",
    period: "/month",
    description: "For labels and power users",
    features: [
      "Everything in Pro",
      "Up to 10 producer sub-accounts",
      "Unlimited merch products",
      "Label dashboard & analytics",
      "Priority support",
      "White-label options",
      "API access",
    ],
    cta: "Go Label",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Marcus J.",
    handle: "@trapgod",
    role: "Trap Producer",
    text: "WAVR changed my life. I went from making $200/month to over $4,000 selling beats. The analytics show me exactly which beats are converting.",
    avatar: "MJ",
    color: "bg-purple-700",
  },
  {
    name: "BeatKing Pro",
    handle: "@beatkingpro",
    role: "Hip-Hop Producer",
    text: "I listed my catalog on WAVR and sold 3 exclusive licenses in the first week. The licensing system is clean and buyers know exactly what they're getting.",
    avatar: "BK",
    color: "bg-fuchsia-700",
  },
  {
    name: "Keisha B.",
    handle: "@kb_sounds",
    role: "R&B Producer",
    text: "My merch store practically runs itself. WAVR handles everything — I just upload designs and get paid. My fans love the quality.",
    avatar: "KB",
    color: "bg-violet-700",
  },
];

const stats = [
  { value: "50K+", label: "Independent Producers" },
  { value: "2M+", label: "Beats Sold" },
  { value: "$12M+", label: "Producer Earnings" },
  { value: "500K+", label: "Licenses Purchased" },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/40 rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="text-purple-300 text-sm font-medium">
              The #1 Beat Marketplace for Independent Producers
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6">
            <span className="text-white">Sell Your Beats,</span>
            <br />
            <span className="text-red-600">
              Own Your Sound
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The premier marketplace for independent producers. List your instrumentals,
            sell flexible licenses, drop merch, and track every dollar — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full text-lg shadow-md"
            >
              Start for Free
            </Link>
            <Link
              href="/marketplace"
              className="border border-gray-700 hover:border-purple-600 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-full text-lg"
            >
              Browse Beats →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                  {s.value}
                </div>
                <div className="text-gray-500 text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Everything You Need to{" "}
              <span className="text-red-500">
                Win
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Built for independent artists who want to own their career and
              maximize their revenue.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.color} border rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className={`${f.accent} mb-4`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.iconPath} />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-gray-400">Up and running in minutes</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up free. Set up your artist profile with your bio, links, and brand.",
              },
              {
                step: "02",
                title: "Upload & Configure",
                desc: "Upload your music, set licensing terms for beats, or design your merch products.",
              },
              {
                step: "03",
                title: "Publish & Earn",
                desc: "Hit publish and start earning. Buyers license your beats instantly and payments hit your account.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="text-6xl font-black text-gray-800 mb-4 leading-none">
                  {item.step}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-950" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Simple, Transparent{" "}
              <span className="text-red-500">
                Pricing
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">No hidden fees. Cancel anytime.</p>
          </div>

          {/* Tabs */}



          <div className="grid sm:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-purple-900/60 to-gray-900 border-purple-600/60 shadow-xl shadow-purple-900/30 scale-105"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-400 text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block text-center font-bold py-3 rounded-xl ${
                    plan.highlighted
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Producers Love WAVR</h2>
            <p className="text-gray-400">
              Join 50,000+ producers already building their income on WAVR
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-700/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">
                      {t.handle} · {t.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-purple-900/40 via-gray-900 to-fuchsia-900/40 border-y border-purple-900/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Ready to Build Your Empire?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Start free today. No credit card required.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-full text-xl shadow-md"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>
    </div>
  );
}
