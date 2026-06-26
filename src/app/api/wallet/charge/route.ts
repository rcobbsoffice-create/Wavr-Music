import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

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
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: "usd",
      customer: u.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      metadata: { userId: user.id, type: "wallet_topup", amount: amountNum.toString() },
    });

    if (intent.status === "succeeded") {
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { increment: amountNum } },
      });
      const updated = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
      return NextResponse.json({ ok: true, balance: updated?.balance ?? 0 });
    }

    // Needs further action (3D Secure) — return client_secret for frontend to handle
    return NextResponse.json({ requiresAction: true, clientSecret: intent.client_secret });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Charge failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
