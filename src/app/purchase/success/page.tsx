"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
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
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">License Issued</p>
            <p className="text-gray-500 text-xs">Available in your dashboard under Licensing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-purple-700/10 rounded-full blur-[120px]" />
      </div>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <PurchaseSuccessContent />
      </Suspense>
    </div>
  );
}

