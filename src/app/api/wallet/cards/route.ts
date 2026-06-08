import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/wallet/cards — list saved payment methods
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!u?.stripeCustomerId) return NextResponse.json([]);

  try {
    const stripe = getStripe();
    const methods = await stripe.paymentMethods.list({
      customer: u.stripeCustomerId,
      type: "card",
    });
    return NextResponse.json(
      methods.data.map((m) => ({
        id: m.id,
        brand: m.card?.brand ?? "card",
        last4: m.card?.last4 ?? "****",
        expMonth: m.card?.exp_month,
        expYear: m.card?.exp_year,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}
