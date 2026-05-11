import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/requests/[id] — single request with bids
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const request = await prisma.beatRequest.findUnique({
    where: { id },
    include: {
      artist: { select: { name: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        include: { producer: { select: { name: true } } },
      },
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: request.id,
    artistId: request.artistId,
    artistName: request.artist.name,
    title: request.title,
    description: request.description,
    genre: request.genre,
    bpm: request.bpm,
    mood: request.mood,
    budget: request.budget,
    deadline: request.deadline,
    status: request.status,
    createdAt: request.createdAt,
    bids: request.bids.map((b) => ({
      id: b.id,
      producerName: b.producer.name,
      producerId: b.producerId,
      message: b.message,
      audioDemo: b.audioDemo,
      price: b.price,
      status: b.status,
      createdAt: b.createdAt,
    })),
  });
}

// PATCH /api/requests/[id] — cancel or close (artist only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.beatRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.artistId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!["cancelled", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.beatRequest.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true, status: updated.status });
}
