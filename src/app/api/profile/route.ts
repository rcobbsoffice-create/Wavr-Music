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
    themeColor: user.themeColor,
    printfulToken: user.printfulToken,
  });
}

import { saveUploadedFile } from "@/lib/uploadFile";

// PATCH /api/profile — update own profile
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contentType = req.headers.get("content-type") || "";
    let data: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const name = (form.get("name") as string | null)?.trim();
      const bio = form.get("bio") as string | null;
      const themeColor = form.get("themeColor") as string | null;
      const avatarFile = form.get("avatar") as File | null;
      const coverFile = form.get("coverImage") as File | null;

      if (name) data.name = name;
      if (bio !== null) data.bio = bio.slice(0, 500);
      if (themeColor) data.themeColor = themeColor;

      if (avatarFile && avatarFile.size > 0) {
        const buf = Buffer.from(await avatarFile.arrayBuffer());
        data.avatar = await saveUploadedFile(buf, avatarFile.name, "avatars");
      }
      if (coverFile && coverFile.size > 0) {
        const buf = Buffer.from(await coverFile.arrayBuffer());
        data.coverImage = await saveUploadedFile(buf, coverFile.name, "covers");
      }
    } else {
      const body = await req.json();
      if (body.name !== undefined) data.name = String(body.name).trim();
      if (body.bio !== undefined) data.bio = String(body.bio).slice(0, 500);
      if (body.themeColor !== undefined) data.themeColor = String(body.themeColor);
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data });

    // Automatically create Printful store for producers if they don't have one
    if (updated.role === "producer" && !updated.printfulStoreId && process.env.PRINTFUL_ADMIN_SECRET) {
      try {
        const storeRes = await fetch("https://api.printful.com/stores", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.PRINTFUL_ADMIN_SECRET}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: `${updated.name}'s Store`, type: "api" })
        });
        const storeData = await storeRes.json();
        if (storeRes.ok && storeData.result?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { printfulStoreId: String(storeData.result.id) }
          });
          updated.printfulStoreId = String(storeData.result.id);
        }
      } catch (err) {
        console.error("Failed to create automatic Printful store:", err);
      }
    }

    return NextResponse.json({
      id: updated.id, name: updated.name, bio: updated.bio, email: updated.email,
      avatar: updated.avatar, coverImage: updated.coverImage, themeColor: updated.themeColor,
      printfulStoreId: updated.printfulStoreId
    });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
