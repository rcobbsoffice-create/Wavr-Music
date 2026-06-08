import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthUser } from "@/lib/apiAuth";

// POST /api/wallet/topup — create a Stripe Payment Intent for wallet top-up
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  const amountNum = parseFloat(amount);
  if (!amountNum || amountNum < 1 || amountNum > 500) {
    return NextResponse.json({ error: "Amount must be between $1 and $500" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: "usd",
      metadata: { userId: user.id, type: "wallet_topup", amount: amountNum.toString() },
    });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
