import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/lyrics — current user's notes
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notes = await prisma.lyricsNote.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { beat: { select: { id: true, title: true, artwork: true } } },
  });
  return NextResponse.json(notes);
}

// POST /api/lyrics — create a note
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, content, beatId, tags } = await req.json();
  const note = await prisma.lyricsNote.create({
    data: {
      userId: user.id,
      title: title?.trim() || "Untitled",
      content: content ?? "",
      beatId: beatId || null,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
    },
    include: { beat: { select: { id: true, title: true, artwork: true } } },
  });
  return NextResponse.json(note, { status: 201 });
}
