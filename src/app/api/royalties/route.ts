import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/royalties — buyer's licenses with stream data
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const licenses = await prisma.license.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      beat: {
        select: {
          id: true,
          title: true,
          producer: { select: { name: true } },
          royaltyReports: true,
        },
      },
    },
  });

  return NextResponse.json(
    licenses.map((l) => ({
      licenseId: l.id,
      beatId: l.beat.id,
      beatTitle: l.beat.title,
      producerName: l.beat.producer.name,
      licenseType: l.type,
      purchasedAt: l.createdAt,
      reports: l.beat.royaltyReports.map((r) => ({
        id: r.id,
        platform: r.platform,
        trackTitle: r.trackTitle,
        streams: r.streams,
        revenue: r.revenue,
        reportedAt: r.reportedAt,
      })),
    }))
  );
}
