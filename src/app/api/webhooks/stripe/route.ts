import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

// Disable body parsing so we can verify the raw Stripe signature
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[Stripe webhook] verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    // --- Beat license purchase ---
    if (meta.beatId && meta.buyerId && meta.licenseType) {
      const { beatId, buyerId, licenseType, price } = meta;
      const salePrice = parseFloat(price ?? "0");
      try {
        await prisma.license.create({
          data: {
            beatId,
            buyerId,
            type: licenseType,
            price: salePrice,
            stripePaymentId: typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          },
        });
        if (licenseType === "exclusive") {
          await prisma.beat.update({
            where: { id: beatId },
            data: { status: "exclusive_sold" },
          });
        }

        // --- Collab split revenue distribution ---
        const beat = await prisma.beat.findUnique({
          where: { id: beatId },
          include: { collaborators: true },
        });
        if (beat && beat.collaborators.length > 0) {
          const totalSplit = beat.collaborators.reduce((s, c) => s + c.split, 0);
          // Remaining % goes to main producer
          const mainSplit = Math.max(0, 100 - totalSplit);
          const payoutOps = beat.collaborators.map((c) =>
            prisma.payout.create({
              data: {
                userId: c.producerId,
                amount: Math.round((salePrice * c.split) / 100 * 100) / 100,
                status: "approved",
                note: `Collab split: ${c.split}% of "${beat.title}" ${licenseType} license`,
              },
            })
          );
          if (mainSplit > 0) {
            payoutOps.push(
              prisma.payout.create({
                data: {
                  userId: beat.producerId,
                  amount: Math.round((salePrice * mainSplit) / 100 * 100) / 100,
                  status: "approved",
                  note: `Primary producer: ${mainSplit}% of "${beat.title}" ${licenseType} license`,
                },
              })
            );
          }
          await Promise.all(payoutOps);
        }

        console.log(`[Stripe webhook] License created: ${licenseType} for beat ${beatId}`);
      } catch (err) {
        console.error("[Stripe webhook] beat license DB error:", err);
        return NextResponse.json({ error: "DB write failed" }, { status: 500 });
      }
    }

    // --- Beat request payment ---
    if (meta.type === "beat_request" && meta.requestId && meta.bidId) {
      try {
        const { requestId, bidId, producerId, price: bidPrice } = meta;
        await prisma.$transaction([
          prisma.beatRequest.update({ where: { id: requestId }, data: { status: "completed" } }),
          prisma.payout.create({
            data: {
              userId: producerId,
              amount: parseFloat(bidPrice ?? "0"),
              status: "approved",
              note: `Custom beat request payment for request ${requestId}`,
            },
          }),
        ]);
        // Notify producer
        await prisma.notification.create({
          data: {
            userId: producerId,
            type: "sale",
            title: "Custom Beat Payment Received",
            message: `Payment of $${parseFloat(bidPrice ?? "0").toFixed(2)} received for your custom beat.`,
            link: `/producer?tab=payouts`,
          },
        });
        console.log(`[Stripe webhook] Beat request ${requestId} completed`);
      } catch (err) {
        console.error("[Stripe webhook] beat request DB error:", err);
        return NextResponse.json({ error: "DB write failed" }, { status: 500 });
      }
    }

    // --- Merch order ---
    if (meta.userId && meta.items) {
      try {
        const items = JSON.parse(meta.items) as { productId: string; quantity: number; size?: string; color?: string }[];
        const shippingAddress = meta.shippingAddress ?? "{}";
        const total = parseFloat(meta.total ?? "0");
        const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;

        await prisma.order.create({
          data: {
            userId: meta.userId,
            total,
            shippingAddress,
            stripePaymentId: paymentIntent,
            status: "processing",
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size ?? null,
                color: item.color ?? null,
                price: 0, // will be filled from product lookup in a real system
              })),
            },
          },
        });
        console.log(`[Stripe webhook] Merch order created for user ${meta.userId}`);
      } catch (err) {
        console.error("[Stripe webhook] merch order DB error:", err);
        return NextResponse.json({ error: "DB write failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
