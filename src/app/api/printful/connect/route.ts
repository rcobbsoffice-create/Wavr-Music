import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: { printfulToken: token },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Printful connect error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
