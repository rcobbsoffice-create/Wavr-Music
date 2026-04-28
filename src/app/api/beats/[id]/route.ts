import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";

// PATCH /api/beats/[id] — update a beat (owner only)
export async function PATCH(
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

  try {
    const contentType = req.headers.get("content-type") ?? "";
    const data: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      // FormData path — may include an artwork file
      const form = await req.formData();
      const allowed = ["title", "genre", "key", "mood", "status", "description"] as const;
      for (const field of allowed) {
        const val = form.get(field);
        if (val !== null) data[field] = String(val);
      }
      const bpmStr = form.get("bpm");
      if (bpmStr) data.bpm = parseInt(String(bpmStr), 10);
      const priceBasic = form.get("priceBasic");
      if (priceBasic) data.priceBasic = parseFloat(String(priceBasic));
      const pricePremium = form.get("pricePremium");
      if (pricePremium) data.pricePremium = parseFloat(String(pricePremium));
      const priceExclusive = form.get("priceExclusive");
      if (priceExclusive) data.priceExclusive = parseFloat(String(priceExclusive));
      const tagsStr = form.get("tags");
      if (tagsStr) {
        try { const parsed = JSON.parse(String(tagsStr)); if (Array.isArray(parsed)) data.tags = JSON.stringify(parsed); } catch { /* ignore */ }
      }
      // Artwork file
      const artworkFile = form.get("artwork") as File | null;
      if (artworkFile && artworkFile.size > 0) {
        const buffer = Buffer.from(await artworkFile.arrayBuffer());
        data.artwork = await saveUploadedFile(buffer, artworkFile.name, "artwork");
      }
      const artworkUrl = form.get("artworkUrl");
      if (artworkUrl) data.artwork = String(artworkUrl);

    } else {
      // JSON path
      const body = await req.json();
      const allowed = ["title", "genre", "bpm", "key", "mood", "tags", "priceBasic", "pricePremium", "priceExclusive", "status", "description"] as const;
      for (const field of allowed) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      if (body.artworkUrl) data.artwork = body.artworkUrl;
      
      if (data.bpm) data.bpm = parseInt(String(data.bpm), 10);
      if (data.priceBasic) data.priceBasic = parseFloat(String(data.priceBasic));
      if (data.pricePremium) data.pricePremium = parseFloat(String(data.pricePremium));
      if (data.priceExclusive) data.priceExclusive = parseFloat(String(data.priceExclusive));
      if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    }

    const updated = await prisma.beat.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/beats/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE /api/beats/[id] — delete a beat (owner or admin)
export async function DELETE(
  _req: NextRequest,
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

  await prisma.beat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
