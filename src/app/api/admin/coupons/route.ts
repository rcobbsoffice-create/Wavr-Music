import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupons = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, discount, maxUses, expiresAt } = body;

  if (!code || typeof discount !== "number" || discount <= 0 || discount > 100) {
    return NextResponse.json({ error: "Code and discount (1–100) are required" }, { status: 400 });
  }

  try {
    const coupon = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        discount,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
}
