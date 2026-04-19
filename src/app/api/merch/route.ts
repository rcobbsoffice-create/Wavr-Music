import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";

// GET /api/merch — list all active products
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");

  const products = await prisma.merchProduct.findMany({
    where: {
      status: "active",
      ...(category && category !== "All" ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    sizes: (() => { try { return JSON.parse(p.sizes); } catch { return []; } })(),
    colors: (() => { try { return JSON.parse(p.colors); } catch { return []; } })(),
    images: (() => { try { return JSON.parse(p.images); } catch { return []; } })(),
    stock: p.stock,
  }));

  return NextResponse.json(result);
}

// POST /api/merch — create a new merch product (admin only)
export async function POST(req: NextRequest) {
  const user = await getAuthUser("admin");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();

    const name     = (form.get("name") as string | null)?.trim();
    const category = (form.get("category") as string | null)?.trim();
    const priceStr = form.get("price") as string | null;
    const description = (form.get("description") as string | null)?.trim() ?? "";
    const sizesRaw    = (form.get("sizes") as string | null) ?? "[]";
    const colorsRaw   = (form.get("colors") as string | null) ?? "[]";
    const imageFile   = form.get("image") as File | null;

    if (!name || !category || !priceStr) {
      return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    let sizes = "[]"; let colors = "[]";
    try { if (Array.isArray(JSON.parse(sizesRaw)))  sizes  = sizesRaw; } catch {}
    try { if (Array.isArray(JSON.parse(colorsRaw))) colors = colorsRaw; } catch {}

    let images = "[]";
    if (imageFile && imageFile.size > 0) {
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const path = await saveUploadedFile(buf, imageFile.name, "merch");
      images = JSON.stringify([path]);
    }

    const product = await prisma.merchProduct.create({
      data: { name, description, category, price, sizes, colors, images },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/merch]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
