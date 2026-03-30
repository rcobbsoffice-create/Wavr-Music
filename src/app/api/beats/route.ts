import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";

// GET /api/beats — public list of all active beats
export async function GET() {
  try {
    const beats = await prisma.beat.findMany({
      where: { status: { not: "draft" } },
      include: { producer: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    const result = beats.map((b) => ({
      id: b.id,
      title: b.title,
      producer: b.producer.name,
      producerId: b.producerId,
      genre: b.genre,
      bpm: b.bpm,
      key: b.key,
      mood: b.mood ?? "",
      tags: (() => { try { return JSON.parse(b.tags); } catch { return []; } })(),
      priceBasic: b.priceBasic,
      pricePremium: b.pricePremium,
      priceExclusive: b.priceExclusive,
      plays: b.plays,
      featured: b.featured,
      status: b.status,
      artwork: b.artwork,
      audioFile: b.audioFile,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/beats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/beats — upload a new beat (requires auth)
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();

    const title = (form.get("title") as string | null)?.trim();
    const genre = (form.get("genre") as string | null)?.trim();
    const bpmStr = form.get("bpm") as string | null;
    const key = (form.get("key") as string | null)?.trim();
    const mood = (form.get("mood") as string | null)?.trim() ?? "";
    const tagsRaw = (form.get("tags") as string | null) ?? "[]";
    const priceBasic = parseFloat((form.get("priceBasic") as string) ?? "29.99");
    const pricePremium = parseFloat((form.get("pricePremium") as string) ?? "99.99");
    const priceExclusive = parseFloat((form.get("priceExclusive") as string) ?? "299.99");
    const audioFileEntry = form.get("audio") as File | null;

    if (!title || !genre || !bpmStr || !key) {
      return NextResponse.json(
        { error: "Title, genre, BPM, and key are required" },
        { status: 400 }
      );
    }

    const bpm = parseInt(bpmStr, 10);
    if (isNaN(bpm) || bpm < 40 || bpm > 300) {
      return NextResponse.json({ error: "BPM must be between 40 and 300" }, { status: 400 });
    }

    // Validate tags JSON
    let tags = "[]";
    try {
      const parsed = JSON.parse(tagsRaw);
      if (Array.isArray(parsed)) tags = JSON.stringify(parsed);
    } catch {
      // keep default
    }

    // Save audio file if provided
    let audioFilePath: string | undefined;
    if (audioFileEntry && audioFileEntry.size > 0) {
      const buffer = Buffer.from(await audioFileEntry.arrayBuffer());
      audioFilePath = await saveUploadedFile(buffer, audioFileEntry.name, "audio");
    }

    const beat = await prisma.beat.create({
      data: {
        title,
        genre,
        bpm,
        key,
        mood,
        tags,
        priceBasic,
        pricePremium,
        priceExclusive,
        producerId: user.id,
        audioFile: audioFilePath,
        status: "active",
      },
    });

    // Handle collaborators (split sheet)
    const collabsRaw = form.get("collaborators") as string | null;
    if (collabsRaw) {
      try {
        const collabs = JSON.parse(collabsRaw) as { email: string; split: string; role?: string }[];
        for (const c of collabs) {
          const collaborator = await prisma.user.findUnique({ where: { email: c.email.trim() } });
          if (collaborator && collaborator.id !== user.id) {
            const splitPct = parseFloat(c.split);
            if (!isNaN(splitPct) && splitPct > 0 && splitPct < 100) {
              await prisma.beatCollaborator.create({
                data: {
                  beatId: beat.id,
                  producerId: collaborator.id,
                  split: splitPct,
                  role: c.role ?? "co-producer",
                },
              });
              // Notify collaborator
              await prisma.notification.create({
                data: {
                  userId: collaborator.id,
                  type: "collab",
                  title: "Added as Collaborator",
                  message: `${user.name} added you as a collaborator on "${beat.title}" with a ${splitPct}% revenue split.`,
                  link: `/producer`,
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn("[POST /api/beats] collaborators parse error:", err);
      }
    }

    // Queue stem separation if audio was uploaded
    if (audioFilePath && process.env.STEMS_WORKER_URL) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/beats/${beat.id}/stems`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal": "1" },
        body: JSON.stringify({}),
      }).catch(() => {});
    }

    return NextResponse.json(beat, { status: 201 });
  } catch (err) {
    console.error("[POST /api/beats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
