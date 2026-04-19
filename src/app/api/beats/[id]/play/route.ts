import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/beats/[id]/play — increments play count + logs AnalyticsEvent
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.$transaction([
      prisma.beat.update({
        where: { id },
        data: { plays: { increment: 1 } },
      }),
      prisma.analyticsEvent.create({
        data: { beatId: id, type: "play" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
