"use client";

import { useState, useEffect } from "react";
import MerchCard, { MerchProduct } from "@/components/MerchCard";
import CartDrawer from "@/components/CartDrawer";

const ALL_CATEGORIES = ["All", "T-Shirts", "Hoodies", "Hats", "Phone Cases", "Tote Bags", "Mugs", "Posters"];

export default function MerchPage() {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const url = selectedCategory === "All"
      ? "/api/merch"
      : `/api/merch?category=${encodeURIComponent(selectedCategory)}`;

    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-900/30 via-gray-900 to-gray-900 border-b border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-white mb-2">Merch Store</h1>
          <p className="text-gray-400 text-lg">
            Artist merch — no inventory needed. We handle everything.
          </p>
        </div>
      </div>

      {/* Dropshipping Banner */}
      <div className="bg-gray-900 border-b border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🎨", title: "Design Your Merch", desc: "Upload your artwork and branding" },
              { icon: "🖨️", title: "We Print It", desc: "High-quality print-on-demand production" },
              { icon: "📦", title: "We Ship It", desc: "Worldwide fulfillment handled for you" },
              { icon: "💰", title: "You Get Paid", desc: "Keep the profit margin on every sale" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* How it works */}
        <div className="bg-gradient-to-r from-purple-900/20 via-gray-900/50 to-fuchsia-900/20 border border-purple-800/30 rounded-2xl p-6 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">No Inventory Needed</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Our dropshipping model means you never hold stock. Create a product, set your price,
                and we handle printing, packaging, and shipping directly to your fans.
                Profit margins typically range from 30–60%.
              </p>
            </div>
            <a
              href="/dashboard"
              className="shrink-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              Create Your Merch Store →
            </a>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
          {!loading && (
            <span className="text-gray-600 text-sm ml-2">{products.length} products</span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-8 bg-gray-800 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((item) => (
              <MerchCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-3xl font-black text-white mb-3">
            Launch Your Own Merch Line
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Start selling your branded merch today. Upload your designs, set prices,
            and start earning. Your fans want to rep your brand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {["T-Shirts", "Hoodies", "Hats", "Phone Cases", "Tote Bags", "Mugs", "Posters"].map((item) => (
              <span
                key={item}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Selling Merch →
          </a>
        </div>
      </div>
    </div>
    <CartDrawer />
  );
}
