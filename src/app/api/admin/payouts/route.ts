import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payouts = await prisma.payout.findMany({
    orderBy: { requestedAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(payouts.map((p) => ({
    id: p.id,
    userName: p.user.name,
    userEmail: p.user.email,
    amount: p.amount,
    method: p.method,
    status: p.status,
    note: p.note,
    requestedAt: p.requestedAt,
    processedAt: p.processedAt,
  })));
}
