import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

// PATCH /api/merch/[id] — update a merch product (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser("admin");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.merchProduct.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.category !== undefined) data.category = String(body.category).trim();
    if (body.price !== undefined) data.price = parseFloat(String(body.price));
    if (body.stock !== undefined) data.stock = parseInt(String(body.stock), 10);
    if (body.status !== undefined) data.status = body.status;
    if (Array.isArray(body.sizes)) data.sizes = JSON.stringify(body.sizes);
    if (Array.isArray(body.colors)) data.colors = JSON.stringify(body.colors);

    const updated = await prisma.merchProduct.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/merch/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/merch/[id] — delete a merch product (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser("admin");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.merchProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
