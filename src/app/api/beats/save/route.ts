import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/beats/save — current user's saved beats
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await prisma.savedBeat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      beat: {
        include: { producer: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(saved.map((s) => s.beat));
}

// POST /api/beats/save — toggle save on a beat
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { beatId } = await req.json();
  if (!beatId) return NextResponse.json({ error: "beatId required" }, { status: 400 });

  const existing = await prisma.savedBeat.findUnique({ where: { userId_beatId: { userId: user.id, beatId } } });
  if (existing) {
    await prisma.savedBeat.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }
  await prisma.savedBeat.create({ data: { userId: user.id, beatId } });
  return NextResponse.json({ saved: true });
}
