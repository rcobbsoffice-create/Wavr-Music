import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/producer/royalties — producer sees all royalty reports across their beats
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.royaltyReport.findMany({
    where: { beat: { producerId: user.id } },
    orderBy: { reportedAt: "desc" },
    include: {
      beat: { select: { title: true } },
      buyer: { select: { name: true } },
    },
  });

  const totalStreams = reports.reduce((s, r) => s + r.streams, 0);
  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);

  // Group by beat
  const byBeat: Record<string, { title: string; streams: number; revenue: number; reports: typeof reports }> = {};
  for (const r of reports) {
    if (!byBeat[r.beatId]) {
      byBeat[r.beatId] = { title: r.beat.title, streams: 0, revenue: 0, reports: [] };
    }
    byBeat[r.beatId].streams += r.streams;
    byBeat[r.beatId].revenue += r.revenue;
    byBeat[r.beatId].reports.push(r);
  }

  return NextResponse.json({
    totalStreams,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    byBeat: Object.entries(byBeat).map(([beatId, data]) => ({
      beatId,
      title: data.title,
      streams: data.streams,
      revenue: Math.round(data.revenue * 100) / 100,
      reports: data.reports.map((r) => ({
        id: r.id,
        buyerName: r.buyer.name,
        platform: r.platform,
        trackTitle: r.trackTitle,
        trackUrl: r.trackUrl,
        streams: r.streams,
        revenue: r.revenue,
        reportedAt: r.reportedAt,
      })),
    })),
    recent: reports.slice(0, 10).map((r) => ({
      id: r.id,
      beatTitle: r.beat.title,
      buyerName: r.buyer.name,
      platform: r.platform,
      trackTitle: r.trackTitle,
      streams: r.streams,
      revenue: r.revenue,
      reportedAt: r.reportedAt,
    })),
  });
}
