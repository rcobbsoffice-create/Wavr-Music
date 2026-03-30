import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" });

// PATCH /api/requests/[id]/bids/[bidId] — accept or reject a bid (artist only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: requestId, bidId } = await params;

  const request = await prisma.beatRequest.findUnique({
    where: { id: requestId },
    include: { bids: { where: { id: bidId } } },
  });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.artistId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bid = request.bids[0];
  if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });

  const { action } = await req.json();

  if (action === "reject") {
    await prisma.beatRequestBid.update({ where: { id: bidId }, data: { status: "rejected" } });
    // Notify producer
    await prisma.notification.create({
      data: {
        userId: bid.producerId,
        type: "bid",
        title: "Bid Not Selected",
        message: `Your bid on "${request.title}" was not selected.`,
        link: `/requests/${requestId}`,
      },
    });
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  if (action === "accept") {
    // Create Stripe checkout session for this bid
    const producer = await prisma.user.findUnique({ where: { id: bid.producerId }, select: { name: true } });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(bid.price * 100),
          product_data: { name: `Custom Beat by ${producer?.name ?? "Producer"}`, description: request.title },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?type=request&requestId=${requestId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestId}`,
      customer_email: user.email,
      metadata: {
        type: "beat_request",
        requestId,
        bidId,
        artistId: user.id,
        producerId: bid.producerId,
        price: String(bid.price),
      },
    });

    // Mark bid as accepted, close other bids, close request
    await prisma.$transaction([
      prisma.beatRequestBid.update({ where: { id: bidId }, data: { status: "accepted" } }),
      prisma.beatRequestBid.updateMany({
        where: { requestId, id: { not: bidId } },
        data: { status: "rejected" },
      }),
      prisma.beatRequest.update({ where: { id: requestId }, data: { status: "closed" } }),
    ]);

    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
