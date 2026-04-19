import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

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
    const body = await req.json();
    const allowed = ["title", "genre", "bpm", "key", "mood", "tags", "priceBasic", "pricePremium", "priceExclusive", "status", "description"] as const;
    const data: Record<string, unknown> = {};
    for (const field of allowed) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (data.bpm) data.bpm = parseInt(String(data.bpm), 10);
    if (data.priceBasic) data.priceBasic = parseFloat(String(data.priceBasic));
    if (data.pricePremium) data.pricePremium = parseFloat(String(data.pricePremium));
    if (data.priceExclusive) data.priceExclusive = parseFloat(String(data.priceExclusive));
    if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);

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
