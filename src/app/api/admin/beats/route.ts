import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "";

  const beats = await prisma.beat.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { producer: { select: { name: true } } },
  });

  return NextResponse.json(beats.map((b) => ({
    id: b.id,
    title: b.title,
    producerName: b.producer.name,
    genre: b.genre,
    status: b.status,
    featured: b.featured,
    plays: b.plays,
    createdAt: b.createdAt,
  })));
}
