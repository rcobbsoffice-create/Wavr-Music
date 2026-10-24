import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { creditWalletTopUp } from "@/lib/wallet";

// POST /api/wallet/charge — charge a saved card off-session to add funds
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, paymentMethodId } = await req.json();
  const amountNum = parseFloat(amount);
  if (!amountNum || amountNum < 1 || amountNum > 500) {
    return NextResponse.json({ error: "Amount must be between $1 and $500" }, { status: 400 });
  }
  if (!paymentMethodId) {
    return NextResponse.json({ error: "paymentMethodId required" }, { status: 400 });
  }

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!u?.stripeCustomerId) {
    return NextResponse.json({ error: "No saved payment methods" }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    // The card must belong to this user's Stripe customer
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== u.stripeCustomerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // The buyer is present, so this is an on-session charge: if the bank wants
    // 3D Secure, Stripe returns requires_action and the client completes it.
    // (off_session: true made Stripe throw "authentication_required" instead.)
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: "usd",
      customer: u.stripeCustomerId,
      payment_method: paymentMethodId,
      payment_method_types: ["card"],
      confirm: true,
      metadata: { userId: user.id, type: "wallet_topup", amount: amountNum.toString() },
    });

    if (intent.status === "succeeded") {
      const result = await creditWalletTopUp(intent);
      const balance = "balance" in result ? result.balance : 0;
      return NextResponse.json({ ok: true, balance });
    }

    if (intent.status === "requires_action") {
      return NextResponse.json({ requiresAction: true, clientSecret: intent.client_secret, paymentIntentId: intent.id });
    }

    return NextResponse.json({ error: "Card was not charged. Try another card." }, { status: 402 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Charge failed";
    const status = (err as { type?: string })?.type === "StripeCardError" ? 402 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
