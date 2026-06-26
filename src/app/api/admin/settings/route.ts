import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["siteName", "siteTagline", "logoUrl", "faviconUrl", "seoTitle", "seoDesc"] as const;
  const data: Record<string, unknown> = {};
  for (const field of allowed) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return NextResponse.json(settings);
}
