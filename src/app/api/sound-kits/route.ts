import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";
export const dynamic = "force-dynamic";

export async function GET() {
  const kits = await prisma.soundKit.findMany({
    where: { status: "active" },
    include: { producer: { select: { id: true, name: true, avatar: true, verified: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(kits.map((k) => ({
    ...k,
    tags: (() => { try { return JSON.parse(k.tags); } catch { return []; } })(),
  })));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = (form.get("title") as string)?.trim();
  const description = (form.get("description") as string)?.trim() ?? "";
  const genre = (form.get("genre") as string)?.trim() ?? "";
  const price = parseFloat((form.get("price") as string) ?? "29.99");
  const tagsRaw = (form.get("tags") as string) ?? "[]";
  const fileCount = parseInt((form.get("fileCount") as string) ?? "0", 10);

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  let tags = "[]";
  try { const p = JSON.parse(tagsRaw); if (Array.isArray(p)) tags = JSON.stringify(p); } catch {}

  let artworkUrl: string | undefined;
  const artworkFile = form.get("artwork") as File | null;
  if (artworkFile && artworkFile.size > 0) {
    artworkUrl = await saveUploadedFile(Buffer.from(await artworkFile.arrayBuffer()), artworkFile.name, "artwork");
  }

  let previewUrl: string | undefined;
  const previewFile = form.get("preview") as File | null;
  if (previewFile && previewFile.size > 0) {
    previewUrl = await saveUploadedFile(Buffer.from(await previewFile.arrayBuffer()), previewFile.name, "audio");
  }

  let downloadUrl: string | undefined;
  const downloadFile = form.get("download") as File | null;
  if (downloadFile && downloadFile.size > 0) {
    downloadUrl = await saveUploadedFile(Buffer.from(await downloadFile.arrayBuffer()), downloadFile.name, "kits");
  }

  const kit = await prisma.soundKit.create({
    data: { title, description, genre, price, tags, fileCount, producerId: user.id, artwork: artworkUrl, previewUrl, downloadUrl },
  });
  return NextResponse.json(kit, { status: 201 });
}
