import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

const STEM_TYPES = ["drums", "bass", "melody", "other"] as const;

// GET /api/beats/[id]/stems — get stem status (public for previews, full paths gated)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stems = await prisma.beatStem.findMany({ where: { beatId: id } });

  // Check if requester has exclusive license (gets full download paths)
  const user = await getAuthUser();
  let hasExclusive = false;
  if (user) {
    const lic = await prisma.license.findFirst({
      where: { beatId: id, buyerId: user.id, type: "exclusive" },
    });
    hasExclusive = !!lic;
  }

  return NextResponse.json(
    stems.map((s) => ({
      type: s.type,
      status: s.status,
      // Only expose file path to exclusive license holders or the producer
      filePath: hasExclusive ? s.filePath : null,
    }))
  );
}

// POST /api/beats/[id]/stems — trigger stem separation (producer only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const beat = await prisma.beat.findUnique({ where: { id } });
  if (!beat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (beat.producerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!beat.audioFile) {
    return NextResponse.json({ error: "Beat has no audio file" }, { status: 400 });
  }

  // Create or reset stem records
  await Promise.all(
    STEM_TYPES.map((type) =>
      prisma.beatStem.upsert({
        where: { beatId_type: { beatId: id, type } },
        create: { beatId: id, type, status: "processing" },
        update: { status: "processing", filePath: null },
      })
    )
  );

  // Call external stem separation worker if configured
  const workerUrl = process.env.STEMS_WORKER_URL;
  if (workerUrl) {
    try {
      const resp = await fetch(`${workerUrl}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: id, audioPath: beat.audioFile }),
      });
      if (!resp.ok) throw new Error("Worker returned error");
      const result = await resp.json() as { stems: { type: string; filePath: string }[] };

      await Promise.all(
        result.stems.map((s: { type: string; filePath: string }) =>
          prisma.beatStem.update({
            where: { beatId_type: { beatId: id, type: s.type } },
            data: { filePath: s.filePath, status: "ready" },
          })
        )
      );
    } catch (err) {
      console.error("[Stems] Worker error:", err);
      await prisma.beatStem.updateMany({
        where: { beatId: id },
        data: { status: "failed" },
      });
      return NextResponse.json({ error: "Stem worker failed. Is STEMS_WORKER_URL configured?" }, { status: 500 });
    }
  } else {
    // No worker configured — mark as failed with helpful message
    await prisma.beatStem.updateMany({
      where: { beatId: id },
      data: { status: "failed" },
    });
    return NextResponse.json({
      ok: false,
      message: "Stem separation worker not configured. Set STEMS_WORKER_URL in .env.local pointing to your Demucs server.",
    });
  }

  return NextResponse.json({ ok: true });
}
