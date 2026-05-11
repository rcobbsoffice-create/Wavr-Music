import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { saveUploadedFile } from "@/lib/uploadFile";

// POST /api/requests/[id]/bids — submit a bid
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: requestId } = await params;
  const request = await prisma.beatRequest.findUnique({ where: { id: requestId } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "open") {
    return NextResponse.json({ error: "This request is no longer accepting bids" }, { status: 400 });
  }
  if (request.artistId === user.id) {
    return NextResponse.json({ error: "You cannot bid on your own request" }, { status: 400 });
  }

  // Check for existing bid
  const existing = await prisma.beatRequestBid.findFirst({
    where: { requestId, producerId: user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "You already submitted a bid on this request" }, { status: 409 });
  }

  try {
    const form = await req.formData();
    const message = (form.get("message") as string | null)?.trim();
    const priceStr = form.get("price") as string | null;
    const demoFile = form.get("demo") as File | null;

    if (!message || !priceStr) {
      return NextResponse.json({ error: "message and price are required" }, { status: 400 });
    }
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    let audioDemo: string | null = null;
    if (demoFile && demoFile.size > 0) {
      const buf = Buffer.from(await demoFile.arrayBuffer());
      audioDemo = await saveUploadedFile(buf, demoFile.name, "demos");
    }

    const bid = await prisma.beatRequestBid.create({
      data: { requestId, producerId: user.id, message, price, audioDemo },
    });

    // Notify the artist
    await prisma.notification.create({
      data: {
        userId: request.artistId,
        type: "bid",
        title: "New Bid on Your Request",
        message: `${user.name} submitted a bid of $${price.toFixed(0)} on "${request.title}"`,
        link: `/requests/${requestId}`,
      },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (err) {
    console.error("[POST /api/requests/[id]/bids]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
