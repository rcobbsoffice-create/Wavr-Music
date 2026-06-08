import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/wallet — return current user's balance
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
  return NextResponse.json({ balance: u?.balance ?? 0 });
}
