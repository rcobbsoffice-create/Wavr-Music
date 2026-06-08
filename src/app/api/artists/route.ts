import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const artists = await prisma.user.findMany({
    where: { role: "artist", suspended: false },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      socialLinks: true,
      _count: { select: { merchProducts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    artists.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      bio: a.bio,
      merch: a._count.merchProducts,
    }))
  );
}
