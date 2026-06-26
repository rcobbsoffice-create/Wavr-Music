import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { getDashboardPath } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const pendingCookie = req.cookies.get("wavr-google-pending")?.value;
  if (!pendingCookie) {
    return NextResponse.json({ error: "Session expired. Please sign in with Google again." }, { status: 400 });
  }

  let pending: { email: string; name: string; avatar: string | null };
  try {
    pending = JSON.parse(pendingCookie);
  } catch {
    return NextResponse.json({ error: "Invalid session. Please try again." }, { status: 400 });
  }

  const { role } = await req.json();
  if (role !== "producer" && role !== "artist") {
    return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
  }

  // Guard against race-condition duplicate
  const existing = await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing) {
    const token = signToken({ userId: existing.id, role: existing.role, email: existing.email });
    const res = NextResponse.json({ redirectTo: getDashboardPath(existing.role) });
    res.cookies.set("wavr-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set("wavr-role", existing.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.delete("wavr-google-pending");
    return res;
  }

  const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
  const user = await prisma.user.create({
    data: {
      email: pending.email,
      name: pending.name,
      password: randomPassword,
      role,
      verified: true,
      avatar: pending.avatar,
    },
  });

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  const res = NextResponse.json({ redirectTo: getDashboardPath(user.role) });

  res.cookies.set("wavr-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("wavr-role", user.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete("wavr-google-pending");

  return res;
}
