import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ valid: false, error: "No code provided" });

  const coupon = await prisma.promoCode.findUnique({ where: { code } });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ valid: false, error: "Invalid or inactive coupon code" });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Coupon code has expired" });
  }
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
    return NextResponse.json({ valid: false, error: "Coupon code has reached its usage limit" });
  }

  return NextResponse.json({ valid: true, discount: coupon.discount, code: coupon.code, id: coupon.id });
}
