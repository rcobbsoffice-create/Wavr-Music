import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/requests — list open requests (public)
export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") ?? "";
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const user = mine ? await getAuthUser() : null;

  const requests = await prisma.beatRequest.findMany({
    where: {
      ...(mine && user ? { artistId: user.id } : { status: "open" }),
      ...(genre ? { genre } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      artist: { select: { name: true } },
      _count: { select: { bids: true } },
    },
  });

  return NextResponse.json(
    requests.map((r) => ({
      id: r.id,
      artistName: r.artist.name,
      title: r.title,
      description: r.description,
      genre: r.genre,
      bpm: r.bpm,
      mood: r.mood,
      budget: r.budget,
      deadline: r.deadline,
      status: r.status,
      bidCount: r._count.bids,
      createdAt: r.createdAt,
    }))
  );
}

// POST /api/requests — create a beat request (any authenticated user)
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, genre, bpm, mood, budget, deadline } = await req.json();

    if (!title?.trim() || !description?.trim() || !budget) {
      return NextResponse.json({ error: "title, description, and budget are required" }, { status: 400 });
    }
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }

    const request = await prisma.beatRequest.create({
      data: {
        artistId: user.id,
        title: title.trim(),
        description: description.trim(),
        genre: genre?.trim() || null,
        bpm: bpm?.trim() || null,
        mood: mood?.trim() || null,
        budget: budgetNum,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    // Notify producers with matching genre (up to 20)
    if (genre) {
      const matchingProducers = await prisma.beat.findMany({
        where: { genre: { contains: genre }, status: "active" },
        distinct: ["producerId"],
        select: { producerId: true },
        take: 20,
      });
      await Promise.all(
        matchingProducers.map((p) =>
          prisma.notification.create({
            data: {
              userId: p.producerId,
              type: "request",
              title: "New Beat Request",
              message: `${user.name} is looking for a ${genre} beat — budget $${budgetNum.toFixed(0)}`,
              link: `/requests/${request.id}`,
            },
          })
        )
      );
    }

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error("[POST /api/requests]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
