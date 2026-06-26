import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";
export const dynamic = "force-dynamic";

export async function GET() {
  const cols = await prisma.collection.findMany({
    where: { status: "active" },
    include: {
      producer: { select: { id: true, name: true, avatar: true, verified: true } },
      beats: { include: { beat: { include: { producer: { select: { name: true } } } } }, orderBy: { order: "asc" } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(cols.map((c) => ({
    ...c,
    tags: (() => { try { return JSON.parse(c.tags); } catch { return []; } })(),
    beatCount: c.beats.length,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = (form.get("title") as string)?.trim();
  const description = (form.get("description") as string)?.trim() ?? "";
  const genre = (form.get("genre") as string)?.trim() ?? "";
  const price = parseFloat((form.get("price") as string) ?? "49.99");
  const tagsRaw = (form.get("tags") as string) ?? "[]";
  const beatIdsRaw = (form.get("beatIds") as string) ?? "[]";

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  let tags = "[]";
  try { const p = JSON.parse(tagsRaw); if (Array.isArray(p)) tags = JSON.stringify(p); } catch {}

  let beatIds: string[] = [];
  try { beatIds = JSON.parse(beatIdsRaw); } catch {}

  let artworkUrl: string | undefined;
  const artworkFile = form.get("artwork") as File | null;
  if (artworkFile && artworkFile.size > 0) {
    artworkUrl = await saveUploadedFile(Buffer.from(await artworkFile.arrayBuffer()), artworkFile.name, "artwork");
  }

  const collection = await prisma.collection.create({
    data: {
      title, description, genre, price, tags, producerId: user.id, artwork: artworkUrl,
      beats: {
        create: beatIds.map((beatId, i) => ({ beatId, order: i })),
      },
    },
  });
  return NextResponse.json(collection, { status: 201 });
}
