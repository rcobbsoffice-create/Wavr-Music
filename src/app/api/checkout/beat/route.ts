import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

const LICENSE_LABELS: Record<string, string> = {
  basic: "Basic License (MP3)",
  premium: "Premium License (MP3 + WAV + Stems)",
  exclusive: "Exclusive License (Full Ownership)",
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { beatId, licenseType } = await req.json();

  if (!beatId || !LICENSE_LABELS[licenseType]) {
    return NextResponse.json({ error: "Invalid beatId or licenseType" }, { status: 400 });
  }

  const beat = await prisma.beat.findUnique({
    where: { id: beatId },
    include: { producer: { select: { name: true } } },
  });

  if (!beat) {
    return NextResponse.json({ error: "Beat not found" }, { status: 404 });
  }

  if (beat.status === "exclusive_sold" || (licenseType === "exclusive" && beat.status === "exclusive_sold")) {
    return NextResponse.json({ error: "This beat is no longer available for that license" }, { status: 409 });
  }

  const priceMap: Record<string, number> = {
    basic: beat.priceBasic,
    premium: beat.pricePremium,
    exclusive: beat.priceExclusive,
  };

  const price = priceMap[licenseType];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `"${beat.title}" — ${LICENSE_LABELS[licenseType]}`,
            description: `by ${beat.producer.name}`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      beatId: beat.id,
      buyerId: user.id,
      licenseType,
      price: price.toString(),
    },
    success_url: `${appUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/marketplace`,
  });

  return NextResponse.json({ url: session.url });
}
