import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/news — public list of published posts
export async function GET() {
  const posts = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return NextResponse.json(posts.map((p) => ({ ...p, authorName: p.author.name })));
}

// POST /api/news — admin creates a news post
export async function POST(req: NextRequest) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, excerpt, content, category, image, published = true } = await req.json();
  if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title, excerpt, and content are required" }, { status: 400 });
  }

  const post = await prisma.newsPost.create({
    data: { title: title.trim(), excerpt: excerpt.trim(), content: content.trim(), category: category ?? "News", image, published, authorId: admin.id },
  });
  return NextResponse.json(post, { status: 201 });
}
