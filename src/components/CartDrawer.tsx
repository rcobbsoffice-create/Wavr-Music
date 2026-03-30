"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const { items, removeItem, updateQty, total, count, clear } = useCart();
  const router = useRouter();

  async function handleCheckout() {
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        setError(data.error ?? "Checkout failed");
        return;
      }
      clear();
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {/* Cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-purple-900/50 transition-colors"
        aria-label="Open cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 z-50 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Cart ({count})</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center mt-16">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-3 bg-gray-800 rounded-xl p-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  {item.size && <p className="text-gray-500 text-xs">Size: {item.size}</p>}
                  <p className="text-purple-400 text-sm font-semibold mt-1">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.productId, item.size, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center justify-center"
                    >−</button>
                    <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.size, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center justify-center"
                    >+</button>
                    <button
                      onClick={() => removeItem(item.productId, item.size)}
                      className="ml-auto text-gray-500 hover:text-red-400 text-xs"
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-800 space-y-3">
            <div className="flex justify-between text-white">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={checking}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
            >
              {checking ? "Redirecting…" : "Checkout →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
