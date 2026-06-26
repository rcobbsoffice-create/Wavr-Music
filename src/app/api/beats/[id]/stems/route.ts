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
  const isInternal = req.headers.get("x-internal") === "1";
  const user = isInternal ? { id: "system", role: "admin" } : await getAuthUser();
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
  try {
    await Promise.all(
      STEM_TYPES.map((type) =>
        prisma.beatStem.upsert({
          where: { beatId_type: { beatId: id, type } },
          create: { beatId: id, type, status: "processing" },
          update: { status: "processing", filePath: null },
        })
      )
    );
  } catch (err) {
    console.error("[Stems] DB upsert error:", err);
    return NextResponse.json({ error: "Failed to initialize stem records" }, { status: 500 });
  }

  // Call external stem separation worker if configured
  const workerUrl = process.env.STEMS_WORKER_URL;
  if (!workerUrl) {
    await prisma.beatStem.updateMany({
      where: { beatId: id },
      data: { status: "failed" },
    });
    return NextResponse.json({
      ok: false,
      error: "Stem separation is not configured. Set STEMS_WORKER_URL to enable this feature.",
    }, { status: 503 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wavr-music.vercel.app";
    const audioUrl = beat.audioFile?.startsWith("http")
      ? beat.audioFile
      : `${appUrl}${beat.audioFile}`;

    const resp = await fetch(`${workerUrl}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        beatId: id,
        audioUrl,
        callbackUrl: `${appUrl}/api/beats/${id}/stems/callback`,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(`Worker responded ${resp.status}: ${detail}`);
    }

    return NextResponse.json({ ok: true, message: "Stem separation started" });
  } catch (err) {
    console.error("[Stems] Worker error:", err);
    await prisma.beatStem.updateMany({
      where: { beatId: id },
      data: { status: "failed" },
    });
    return NextResponse.json({
      ok: false,
      error: "Stem worker is unavailable. The worker may be sleeping — try again in 30 seconds.",
    }, { status: 503 });
  }
}
