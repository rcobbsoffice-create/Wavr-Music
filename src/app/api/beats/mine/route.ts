import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/beats/mine — returns the authenticated producer's beats with sales/revenue
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const beats = await prisma.beat.findMany({
      where: { producerId: user.id },
      include: {
        licenses: {
          select: { price: true },
        },
        stems: {
          select: { type: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = beats.map((b) => ({
      id: b.id,
      title: b.title,
      genre: b.genre,
      bpm: b.bpm,
      key: b.key,
      mood: b.mood ?? "",
      priceBasic: b.priceBasic,
      pricePremium: b.pricePremium,
      priceExclusive: b.priceExclusive,
      plays: b.plays,
      sales: b.licenses.length,
      revenue: b.licenses.reduce((sum, l) => sum + l.price, 0),
      status: b.status,
      featured: b.featured,
      audioFile: b.audioFile,
      artwork: b.artwork,
      stems: b.stems,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/beats/mine]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
