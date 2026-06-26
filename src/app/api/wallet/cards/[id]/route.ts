import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthUser } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

// DELETE /api/wallet/cards/[id] — detach a saved card
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!u?.stripeCustomerId) return NextResponse.json({ error: "No customer" }, { status: 400 });

  try {
    const stripe = getStripe();
    // Verify the card belongs to this customer before detaching
    const pm = await stripe.paymentMethods.retrieve(id);
    if (pm.customer !== u.stripeCustomerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await stripe.paymentMethods.detach(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove card";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
