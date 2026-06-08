import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const hasKey = key.startsWith("sk_live_") || key.startsWith("sk_test_");
  const masked = hasKey ? `${key.slice(0, 8)}…${key.slice(-4)}` : "not set";

  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();
    return NextResponse.json({ masked, status: res.status, object: data.object ?? data.error?.type });
  } catch (err) {
    return NextResponse.json({ masked, fetchError: String(err) }, { status: 500 });
  }
}
