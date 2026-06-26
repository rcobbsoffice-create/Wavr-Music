import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// POST /api/wallet/use — buy a beat using wallet balance (no Stripe involved)
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { beatId, licenseType, couponCode } = await req.json();
  if (!beatId || !licenseType) {
    return NextResponse.json({ error: "beatId and licenseType required" }, { status: 400 });
  }

  const beat = await prisma.beat.findUnique({ where: { id: beatId } });
  if (!beat) return NextResponse.json({ error: "Beat not found" }, { status: 404 });
  if (beat.status === "exclusive_sold" && licenseType === "exclusive") {
    return NextResponse.json({ error: "Exclusive license already sold" }, { status: 409 });
  }

  const priceMap: Record<string, number> = {
    basic: beat.priceBasic,
    premium: beat.pricePremium,
    exclusive: beat.priceExclusive,
  };
  if (!priceMap[licenseType]) return NextResponse.json({ error: "Invalid licenseType" }, { status: 400 });

  let price = priceMap[licenseType];

  // Apply coupon if provided
  if (couponCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: String(couponCode).toUpperCase().trim() },
    });
    const now = new Date();
    if (promo?.active && (!promo.expiresAt || promo.expiresAt > now) && (promo.maxUses === null || promo.uses < promo.maxUses)) {
      price = Math.round(price * (1 - promo.discount / 100) * 100) / 100;
      await prisma.promoCode.update({ where: { id: promo.id }, data: { uses: { increment: 1 } } });
    }
  }

  // Fetch fresh balance and deduct atomically
  const updated = await prisma.user.updateMany({
    where: { id: user.id, balance: { gte: price } },
    data: { balance: { decrement: price } },
  });

  if (updated.count === 0) {
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
    return NextResponse.json({
      error: "Insufficient wallet balance",
      balance: current?.balance ?? 0,
      required: price,
    }, { status: 402 });
  }

  // Create license record
  const license = await prisma.license.create({
    data: { beatId, buyerId: user.id, type: licenseType, price },
  });

  if (licenseType === "exclusive") {
    await prisma.beat.update({ where: { id: beatId }, data: { status: "exclusive_sold" } });
  }

  // Credit the producer
  await prisma.user.update({
    where: { id: beat.producerId },
    data: { balance: { increment: price * 0.8 } }, // 80% to producer
  }).catch(() => {});

  return NextResponse.json({ ok: true, licenseId: license.id });
}
