import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/payouts — producer's own payout history
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payouts = await prisma.payout.findMany({
    where: { userId: user.id },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(payouts);
}

// POST /api/payouts — request a payout
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount, method = "stripe" } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    }
    if (!["stripe", "paypal"].includes(method)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    // Check for a pending payout already
    const pending = await prisma.payout.findFirst({
      where: { userId: user.id, status: "pending" },
    });
    if (pending) {
      return NextResponse.json({ error: "You already have a pending payout request" }, { status: 409 });
    }

    const payout = await prisma.payout.create({
      data: { userId: user.id, amount, method, status: "pending" },
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (err) {
    console.error("[POST /api/payouts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
