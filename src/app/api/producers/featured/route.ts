import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const producers = await prisma.user.findMany({
    where: { role: "producer", suspended: false },
    select: {
      id: true,
      name: true,
      avatar: true,
      genres: true,
      _count: { select: { beats: true, licenses: true } },
    },
    orderBy: { licenses: { _count: "desc" } },
    take: 8,
  });

  return NextResponse.json(
    producers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      role: (() => {
        try { const g = JSON.parse(p.genres); return g[0] ?? "Producer"; } catch { return "Producer"; }
      })(),
      sales: p._count.licenses,
      beats: p._count.beats,
    }))
  );
}
