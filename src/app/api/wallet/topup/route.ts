import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

async function ensureCustomer(userId: string, email: string, name: string): Promise<string> {
  const stripe = getStripe();
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (u?.stripeCustomerId) return u.stripeCustomerId;
  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

// POST /api/wallet/topup — create a PaymentIntent; saves card for future use
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
    const customerId = await ensureCustomer(user.id, user.email, user.name);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: "usd",
      customer: customerId,
      setup_future_usage: "off_session", // saves card after payment
      metadata: { userId: user.id, type: "wallet_topup", amount: amountNum.toString() },
    });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
