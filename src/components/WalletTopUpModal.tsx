"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").trim();
const stripePromise = pk ? loadStripe(pk) : null;

const PRESETS = [10, 25, 50, 100];

function CheckoutForm({ amount, onSuccess, onCancel }: {
  amount: number;
  onSuccess: (newBalance: number) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Fetch new balance and call success
      const res = await fetch("/api/wallet");
      const data = await res.json();
      onSuccess(data.balance ?? 0);
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!stripe || processing}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
          {processing ? "Processing…" : `Add $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function WalletTopUpModal({ onClose, onSuccess, initialAmount }: {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  initialAmount?: number;
}) {
  const [amount, setAmount] = useState(initialAmount ?? 25);
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  async function createIntent() {
    if (!finalAmount || finalAmount < 1) { setError("Enter at least $1"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      setClientSecret(data.clientSecret);
    } catch { setError("Network error"); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Add Funds to Wallet</h2>
            <p className="text-gray-500 text-xs mt-0.5">Funds are added instantly after payment</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!clientSecret ? (
            <>
              <div>
                <p className="text-gray-400 text-sm mb-3">Select amount</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESETS.map(p => (
                    <button key={p} type="button"
                      onClick={() => { setAmount(p); setCustomAmount(""); }}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                        amount === p && !customAmount
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >${p}</button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" min="1" max="500" step="0.01"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                    placeholder="Custom amount"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">You'll add</span>
                <span className="text-white font-black text-xl">${(finalAmount || 0).toFixed(2)}</span>
              </div>

              <button onClick={createIntent} disabled={loading || !finalAmount || finalAmount < 1}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition-colors">
                {loading ? "Loading…" : "Continue to Payment"}
              </button>
            </>
          ) : !stripePromise ? (
            <p className="text-red-400 text-sm text-center py-4">Payment not configured. Contact support.</p>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
              <CheckoutForm
                amount={finalAmount}
                onSuccess={(bal) => { onSuccess(bal); onClose(); }}
                onCancel={() => setClientSecret(null)}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
