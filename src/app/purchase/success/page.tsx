"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Shown when Stripe redirects back after a wallet top-up (?type=wallet&payment_intent=pi_...)
function WalletTopUpResult({ paymentIntentId }: { paymentIntentId: string | null }) {
  const [state, setState] = useState<{ status: "loading" | "done" | "pending" | "error"; balance?: number; error?: string }>({ status: "loading" });

  useEffect(() => {
    if (!paymentIntentId) { setState({ status: "error", error: "Missing payment reference." }); return; }
    fetch("/api/wallet/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (ok && data.ok) setState({ status: "done", balance: data.balance });
        else if (ok && data.pending) setState({ status: "pending" });
        else setState({ status: "error", error: data.error });
      })
      .catch(() => setState({ status: "error", error: "Network error." }));
  }, [paymentIntentId]);

  const heading = state.status === "done" ? "Funds Added!" : state.status === "pending" ? "Payment Processing" : state.status === "error" ? "Almost There" : "Adding Funds…";
  const body = state.status === "done"
    ? `Your wallet balance is now $${(state.balance ?? 0).toFixed(2)}.`
    : state.status === "pending"
      ? "Your payment is still clearing. Your balance will update automatically."
      : state.status === "error"
        ? `We couldn't confirm the top-up yet (${state.error ?? "unknown error"}). If you were charged, it will be added automatically.`
        : "Confirming your payment with Stripe.";

  return (
    <div className="relative text-center max-w-md w-full">
      <h1 className="text-3xl font-black text-white mb-2">{heading}</h1>
      <p className="text-gray-400 mb-8 leading-relaxed">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">Go to Dashboard</Link>
        <Link href="/marketplace" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-xl transition-colors">Back to Marketplace</Link>
      </div>
    </div>
  );
}

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const isWallet = searchParams.get("type") === "wallet";
  if (isWallet) return <WalletTopUpResult paymentIntentId={searchParams.get("payment_intent")} />;
  return <LicensePurchaseResult sessionId={searchParams.get("session_id")} />;
}

function LicensePurchaseResult({ sessionId }: { sessionId: string | null }) {
  const [dots, setDots] = useState(".");

  // Animate the dots to give a sense of processing
  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(() => setDots((d) => (d.length < 3 ? d + "." : ".")), 500);
    const stop = setTimeout(() => clearInterval(id), 2000);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [sessionId]);

  return (
    <div className="relative text-center max-w-md w-full">
      {/* Check icon */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/40">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-white mb-2">Purchase Complete!</h1>
      <p className="text-gray-400 mb-8 leading-relaxed">
        Your license has been confirmed{dots} You can download your files from your dashboard.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">License Issued</p>
            <p className="text-gray-500 text-xs">Available in your dashboard under Licensing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Confirmation Email Sent</p>
            <p className="text-gray-500 text-xs">Check your inbox for receipt and license terms</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard"
          className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-600 hover:to-blue-400 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/marketplace"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-blue-900/30 rounded-full blur-[120px]" />
      </div>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <PurchaseSuccessContent />
      </Suspense>
    </div>
  );
}

