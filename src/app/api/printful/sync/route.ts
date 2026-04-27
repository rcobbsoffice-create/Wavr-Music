import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the token directly from DB just to be sure we have the latest
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.printfulToken) {
    return NextResponse.json({ error: "Printful not connected" }, { status: 400 });
  }

  try {
    // Fetch products from Printful Store API
    const res = await fetch("https://api.printful.com/store/products", {
      headers: {
        "Authorization": `Bearer ${dbUser.printfulToken}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    if (!res.ok || data.code !== 200) {
      console.error("Printful fetch failed:", data);
      return NextResponse.json({ error: "Failed to fetch from Printful" }, { status: 502 });
    }

    const printfulProducts = data.result || [];
    let syncedCount = 0;

    for (const item of printfulProducts) {
      // Check if product already exists by printfulId
      const existing = await prisma.merchProduct.findFirst({
        where: { producerId: user.id, printfulId: String(item.id) }
      });

      if (!existing) {
        // Create new synced merch product
        await prisma.merchProduct.create({
          data: {
            producerId: user.id,
            name: item.name,
            description: "Imported from Printful",
            category: "Printful Merch",
            price: 29.99, // Sync products usually need variant pricing fetched separately, setting default for now
            images: item.thumbnail_url ? [item.thumbnail_url] : [],
            sizes: ["S", "M", "L", "XL"],
            colors: ["Black", "White"],
            printfulId: String(item.id),
            status: "active",
          }
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (err) {
    console.error("Printful sync error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
