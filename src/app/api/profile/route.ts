import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/profile — own profile
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
    plan: user.plan,
    verified: user.verified,
  });
}

// PATCH /api/profile — update own profile
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name || name.length > 100) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      data.name = name;
    }
    if (body.bio !== undefined) {
      data.bio = String(body.bio).slice(0, 500) || null;
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      id: updated.id, name: updated.name, bio: updated.bio, email: updated.email,
    });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
