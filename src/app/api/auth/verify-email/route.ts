import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { verifyToken: token } });

  if (!user) {
    return NextResponse.json({ error: "Invalid or already used verification link." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verifyToken: null },
  });

  return NextResponse.json({ ok: true });
}
