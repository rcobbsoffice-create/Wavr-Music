import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RANGE_MAP: Record<string, number> = {
  "7": 7,
  "30": 30,
  "90": 90,
  "365": 365,
};

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET(req: NextRequest) {
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "30";
  const days = RANGE_MAP[rangeParam] ?? 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // --- Fetch raw data in parallel ---
  const [playEvents, licenses, beats] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { type: "play", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.license.findMany({
      where: { createdAt: { gte: since } },
      select: { price: true, type: true, createdAt: true },
    }),
    prisma.beat.findMany({
      select: { id: true, title: true, plays: true, licenses: { select: { price: true, type: true } } },
      orderBy: { plays: "desc" },
      take: 10,
    }),
  ]);

  // --- Build day buckets ---
  const buckets: Record<string, { plays: number; revenue: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets[dayLabel(d)] = { plays: 0, revenue: 0 };
  }

  for (const ev of playEvents) {
    const key = dayLabel(new Date(ev.createdAt));
    if (buckets[key]) buckets[key].plays++;
  }

  for (const lic of licenses) {
    const key = dayLabel(new Date(lic.createdAt));
    if (buckets[key]) buckets[key].revenue += lic.price;
  }

  const dailyData = Object.entries(buckets).map(([date, v]) => ({
    date,
    plays: v.plays,
    revenue: Math.round(v.revenue * 100) / 100,
  }));

  // --- Totals ---
  const [totalPlays, totalRevenue, totalLicenses, totalProducers] = await Promise.all([
    prisma.beat.aggregate({ _sum: { plays: true } }),
    prisma.license.aggregate({ _sum: { price: true } }),
    prisma.license.count(),
    prisma.beat.findMany({ distinct: ["producerId"], select: { producerId: true } })
      .then((r) => r.length),
  ]);

  // --- License type breakdown ---
  const typeCounts = await prisma.license.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  const licenseTotal = typeCounts.reduce((s, t) => s + t._count.type, 0) || 1;
  const licenseTypes = typeCounts.map((t) => ({
    name: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} License`,
    count: t._count.type,
    pct: Math.round((t._count.type / licenseTotal) * 100),
  }));

  // --- Top beats ---
  const topBeats = beats.map((b) => ({
    id: b.id,
    title: b.title,
    plays: b.plays,
    revenue: b.licenses.reduce((s, l) => s + l.price, 0),
    licenses: b.licenses.length,
    topLicenseType: b.licenses.length > 0
      ? (b.licenses.find((l) => l.type === "exclusive")?.type ??
         b.licenses.find((l) => l.type === "premium")?.type ??
         "basic")
      : null,
  }));

  return NextResponse.json({
    days: dailyData,
    totals: {
      plays: totalPlays._sum.plays ?? 0,
      revenue: Math.round((totalRevenue._sum.price ?? 0) * 100) / 100,
      licenses: totalLicenses,
      producers: totalProducers,
    },
    topBeats,
    licenseTypes,
  });
}
