import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = await prisma.soundKit.findUnique({
    where: { id },
    include: { producer: { select: { id: true, name: true, avatar: true, verified: true } } },
  });
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...kit, tags: (() => { try { return JSON.parse(kit.tags); } catch { return []; } })() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const kit = await prisma.soundKit.findUnique({ where: { id } });
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (kit.producerId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.soundKit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
