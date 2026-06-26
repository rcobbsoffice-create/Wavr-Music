"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").trim();
const stripePromise = pk ? loadStripe(pk) : null;

const PRESETS = [10, 25, 50, 100];

interface SavedCard { id: string; brand: string; last4: string; expMonth?: number; expYear?: number; }

function brandIcon(brand: string) {
  const map: Record<string, string> = { visa: "💳 Visa", mastercard: "💳 Mastercard", amex: "💳 Amex", discover: "💳 Discover" };
  return map[brand] ?? "💳";
}

// ─── New card form (embedded Stripe Elements) ─────────────────────────────────
function NewCardForm({ amount, onSuccess, onCancel }: {
  amount: number;
  onSuccess: (balance: number) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true); setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/purchase/success?type=wallet`,
      },
    });

    if (stripeError) { setError(stripeError.message ?? "Payment failed"); setProcessing(false); return; }

    if (paymentIntent?.status === "succeeded") {
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
      <p className="text-gray-600 text-xs">Your card will be saved for future purchases.</p>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors">
          Back
        </button>
        <button type="submit" disabled={!stripe || processing}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
          {processing ? "Processing…" : `Add $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function WalletTopUpModal({ onClose, onSuccess, initialAmount }: {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  initialAmount?: number;
}) {
  const [amount, setAmount] = useState(initialAmount ?? 25);
  const [customAmount, setCustomAmount] = useState("");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [showNewCard, setShowNewCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [charging, setCharging] = useState<string | null>(null); // paymentMethodId being charged
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  useEffect(() => {
    fetch("/api/wallet/cards")
      .then(r => r.json())
      .then(d => { setSavedCards(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setCardsLoading(false));
  }, []);

  async function chargeCard(pm: SavedCard) {
    if (!finalAmount || finalAmount < 1) { setError("Enter an amount first"); return; }
    setCharging(pm.id); setError("");
    try {
      const res = await fetch("/api/wallet/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, paymentMethodId: pm.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Charge failed"); return; }
      if (data.ok) { onSuccess(data.balance); onClose(); return; }
      // 3D Secure required — fall through to Elements for confirmation
      if (data.requiresAction && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowNewCard(true);
      }
    } catch { setError("Network error. Try again."); }
    finally { setCharging(null); }
  }

  async function openNewCardForm() {
    if (!finalAmount || finalAmount < 1) { setError("Enter an amount first"); return; }
    setError("");
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setClientSecret(data.clientSecret);
    setShowNewCard(true);
  }

  async function removeCard(id: string) {
    setRemovingId(id);
    await fetch(`/api/wallet/cards/${id}`, { method: "DELETE" });
    setSavedCards(prev => prev.filter(c => c.id !== id));
    setRemovingId(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
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
          {/* Amount selector — always visible */}
          {!showNewCard && (
            <div>
              <p className="text-gray-400 text-sm mb-3">Select amount</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESETS.map(p => (
                  <button key={p} type="button"
                    onClick={() => { setAmount(p); setCustomAmount(""); setError(""); }}
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
                <input type="number" min="1" max="500" step="0.01" value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setAmount(0); setError(""); }}
                  placeholder="Custom amount"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Embedded new card form */}
          {showNewCard && clientSecret ? (
            !stripePromise ? (
              <p className="text-red-400 text-sm text-center py-4">Payment not configured. Contact support.</p>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
                <NewCardForm
                  amount={finalAmount}
                  onSuccess={(bal) => { onSuccess(bal); onClose(); }}
                  onCancel={() => { setShowNewCard(false); setClientSecret(null); }}
                />
              </Elements>
            )
          ) : (
            <>
              {/* Saved cards */}
              {cardsLoading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}
                </div>
              ) : savedCards.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Saved Cards</p>
                  {savedCards.map(card => (
                    <div key={card.id} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">
                          {brandIcon(card.brand)} •••• {card.last4}
                        </p>
                        {card.expMonth && (
                          <p className="text-gray-500 text-xs">Expires {card.expMonth}/{card.expYear}</p>
                        )}
                      </div>
                      <button
                        onClick={() => chargeCard(card)}
                        disabled={charging === card.id || !finalAmount || finalAmount < 1}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        {charging === card.id ? "Charging…" : `Add $${finalAmount.toFixed(2)}`}
                      </button>
                      <button
                        onClick={() => removeCard(card.id)}
                        disabled={removingId === card.id}
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 p-1"
                        title="Remove card"
                      >
                        {removingId === card.id ? (
                          <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Add new card button */}
              <button onClick={openNewCardForm}
                disabled={!finalAmount || finalAmount < 1}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors border ${
                  savedCards.length > 0
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                    : "bg-blue-600 hover:bg-blue-500 text-white border-transparent"
                } disabled:opacity-40`}>
                {savedCards.length > 0 ? "+ Add a new card" : "Pay by Card"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
