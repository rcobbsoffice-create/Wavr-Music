"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";

export interface MerchProduct {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "T-Shirts":    "from-purple-900 via-violet-900 to-black",
  "Hoodies":     "from-gray-800 via-slate-900 to-black",
  "Hats":        "from-fuchsia-900 via-purple-900 to-black",
  "Phone Cases": "from-blue-900 via-indigo-900 to-black",
  "Tote Bags":   "from-green-900 via-teal-900 to-black",
  "Mugs":        "from-orange-900 via-amber-900 to-black",
  "Posters":     "from-pink-900 via-rose-900 to-black",
};

interface MerchCardProps {
  item: MerchProduct;
}

export default function MerchCard({ item }: MerchCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(item.sizes[1] ?? item.sizes[0] ?? "");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const gradient = CATEGORY_GRADIENTS[item.category] ?? "from-purple-900 via-gray-900 to-black";
  const image = item.images[0] ?? null;

  function handleAddToCart() {
    addItem({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      size: selectedSize || undefined,
      image: image ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 group">
      {/* Product image / artwork */}
      <div className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {image ? (
          <img src={image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="opacity-30 group-hover:opacity-40 transition-opacity duration-300">
            {item.category === "T-Shirts" && (
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 100 100">
                <path d="M30 10 L10 30 L20 35 L20 90 L80 90 L80 35 L90 30 L70 10 L60 20 Q50 25 40 20 Z" />
              </svg>
            )}
            {item.category === "Hoodies" && (
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 100 100">
                <path d="M25 10 L5 35 L18 40 L18 90 L82 90 L82 40 L95 35 L75 10 L65 20 Q55 30 45 20 Z" />
                <rect x="44" y="10" width="12" height="20" rx="4" />
              </svg>
            )}
            {item.category === "Hats" && (
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 100 100">
                <ellipse cx="50" cy="65" rx="45" ry="8" />
                <ellipse cx="50" cy="45" rx="30" ry="22" />
                <rect x="20" y="43" width="60" height="6" rx="2" />
              </svg>
            )}
            {item.category === "Phone Cases" && (
              <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 100 100">
                <rect x="25" y="10" width="50" height="80" rx="8" />
                <rect x="30" y="18" width="40" height="60" rx="4" fill="none" stroke="white" strokeWidth="3" />
                <circle cx="50" cy="83" r="4" fill="white" opacity="0.5" />
              </svg>
            )}
            {!["T-Shirts","Hoodies","Hats","Phone Cases"].includes(item.category) && (
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 backdrop-blur-sm text-xs text-gray-300 px-2.5 py-1 rounded-full border border-gray-700/50">
            {item.category}
          </span>
        </div>

        {/* Low stock warning */}
        {item.stock < 10 && item.stock > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-red-900/70 text-red-300 text-xs px-2 py-0.5 rounded-full">
              Only {item.stock} left
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-white font-semibold text-sm">{item.name}</h3>
          {item.description && (
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Color swatches */}
        {item.colors.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {item.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                title={color}
                className="w-4 h-4 rounded-full border border-gray-700 bg-gray-600 text-gray-400"
                style={{ backgroundColor: color.toLowerCase() === "black" ? "#111" : color.toLowerCase() === "white" ? "#eee" : undefined }}
              />
            ))}
          </div>
        )}

        {/* Size selector */}
        {item.sizes.length > 0 && (
          <div className="mb-3">
            <p className="text-gray-500 text-xs mb-1.5">Size</p>
            <div className="flex flex-wrap gap-1.5">
              {item.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs px-2 py-1 rounded border transition-colors duration-150 ${
                    selectedSize === size
                      ? "border-purple-500 bg-purple-900/30 text-purple-300"
                      : "border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-white font-bold text-lg">${item.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={item.stock === 0}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
              item.stock === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : added
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white"
            }`}
          >
            {item.stock === 0 ? "Sold Out" : added ? "✓ Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
