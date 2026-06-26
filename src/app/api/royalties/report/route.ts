import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// POST /api/royalties/report — buyer submits a royalty report for a licensed beat
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { licenseId, platform, trackTitle, trackUrl, streams, revenue } = await req.json();

    if (!licenseId || !platform || !trackTitle) {
      return NextResponse.json({ error: "licenseId, platform, and trackTitle are required" }, { status: 400 });
    }

    // Verify caller owns this license
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { beat: { select: { producerId: true, title: true } } },
    });
    if (!license || license.buyerId !== user.id) {
      return NextResponse.json({ error: "License not found or access denied" }, { status: 403 });
    }

    const report = await prisma.royaltyReport.create({
      data: {
        beatId: license.beatId,
        licenseId,
        buyerId: user.id,
        platform: platform.trim(),
        trackTitle: trackTitle.trim(),
        trackUrl: trackUrl?.trim() || null,
        streams: parseInt(String(streams), 10) || 0,
        revenue: parseFloat(String(revenue)) || 0,
      },
    });

    // Notify the producer
    await prisma.notification.create({
      data: {
        userId: license.beat.producerId,
        type: "royalty",
        title: "New Royalty Report",
        message: `${user.name} reported ${(parseInt(String(streams), 10) || 0).toLocaleString()} streams of "${license.beat.title}" on ${platform}`,
        link: `/producer?tab=analytics`,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("[POST /api/royalties/report]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
