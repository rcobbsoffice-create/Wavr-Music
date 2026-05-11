import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

async function getNote(id: string, userId: string) {
  return prisma.lyricsNote.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const note = await getNote(id, user.id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, content, beatId, tags } = await req.json();
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim() || "Untitled";
  if (content !== undefined) data.content = content;
  if (beatId !== undefined) data.beatId = beatId || null;
  if (tags !== undefined) data.tags = JSON.stringify(Array.isArray(tags) ? tags : []);
  const updated = await prisma.lyricsNote.update({
    where: { id },
    data,
    include: { beat: { select: { id: true, title: true, artwork: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const note = await getNote(id, user.id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.lyricsNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
