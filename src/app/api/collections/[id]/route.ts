import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await prisma.collection.findUnique({
    where: { id },
    include: {
      producer: { select: { id: true, name: true, avatar: true, verified: true } },
      beats: {
        include: { beat: { include: { producer: { select: { name: true } } } } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...col,
    tags: (() => { try { return JSON.parse(col.tags); } catch { return []; } })(),
    beats: col.beats.map((cb) => ({
      ...cb.beat,
      tags: (() => { try { return JSON.parse(cb.beat.tags); } catch { return []; } })(),
      producer: cb.beat.producer.name,
    })),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const col = await prisma.collection.findUnique({ where: { id } });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (col.producerId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
