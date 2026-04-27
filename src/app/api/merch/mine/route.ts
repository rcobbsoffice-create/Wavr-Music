import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// GET /api/merch/mine — list merch uploaded by the current producer
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "producer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.merchProduct.findMany({
      where: { producerId: user.id },
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
      status: p.status,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/merch/mine]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
