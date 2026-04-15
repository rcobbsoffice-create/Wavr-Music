"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in this link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          setTimeout(() => router.push("/producer"), 3000);
        } else {
          const data = await res.json();
          setErrorMsg(data.error ?? "Verification failed.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      });
  }, [token, router]);

  return (
    <div className="relative w-full max-w-md text-center">
      <Link href="/">
        <span className="text-4xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
          WAVR
        </span>
      </Link>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-gray-400">Verifying your email…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-green-900/40">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white font-black text-2xl">Email verified!</h1>
            <p className="text-gray-400 text-sm">
              Your account is fully active. Redirecting you to your dashboard…
            </p>
            <Link
              href="/producer"
              className="inline-block mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-700/40 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white font-bold text-xl">Verification failed</h1>
            <p className="text-gray-400 text-sm">{errorMsg}</p>
            <div className="flex flex-col gap-2 mt-4">
              <ResendButton />
              <Link href="/producer" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                Skip for now →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-purple-700/10 rounded-full blur-[120px]" />
      </div>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}


function ResendButton() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return sent ? (
    <p className="text-green-400 text-sm">A new link has been sent to your email.</p>
  ) : (
    <button
      onClick={resend}
      disabled={sending}
      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors disabled:opacity-60"
    >
      {sending ? "Sending…" : "Resend verification email"}
    </button>
  );
}
