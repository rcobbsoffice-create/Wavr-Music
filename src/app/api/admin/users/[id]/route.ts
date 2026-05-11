import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["suspended", "role", "plan", "verified", "name"] as const;
  const data: Record<string, unknown> = {};
  for (const field of allowed) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  if (body.email) {
    const conflict = await prisma.user.findFirst({ where: { email: body.email, NOT: { id } } });
    if (conflict) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    data.email = body.email;
  }

  if (body.password) {
    if (body.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    data.password = await bcrypt.hash(body.password, 10);
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true, suspended: updated.suspended, role: updated.role, email: updated.email });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  try {
    await prisma.$transaction([
      // Royalty reports reference licenses — delete first
      prisma.royaltyReport.deleteMany({ where: { buyerId: id } }),
      prisma.royaltyReport.deleteMany({ where: { beat: { producerId: id } } }),
      // Sound kit licenses
      prisma.soundKitLicense.deleteMany({ where: { buyerId: id } }),
      prisma.soundKitLicense.deleteMany({ where: { soundKit: { producerId: id } } }),
      // Licenses (beat purchases)
      prisma.license.deleteMany({ where: { buyerId: id } }),
      prisma.license.deleteMany({ where: { beat: { producerId: id } } }),
      // Order items → orders
      prisma.orderItem.deleteMany({ where: { order: { userId: id } } }),
      prisma.order.deleteMany({ where: { userId: id } }),
      // Collection junction table
      prisma.collectionBeat.deleteMany({ where: { collection: { producerId: id } } }),
      // Analytics events
      prisma.analyticsEvent.deleteMany({ where: { userId: id } }),
      prisma.analyticsEvent.deleteMany({ where: { beat: { producerId: id } } }),
      // Beat children
      prisma.beatCollaborator.deleteMany({ where: { producerId: id } }),
      prisma.beatCollaborator.deleteMany({ where: { beat: { producerId: id } } }),
      prisma.beatRequestBid.deleteMany({ where: { producerId: id } }),
      prisma.beatStem.deleteMany({ where: { beat: { producerId: id } } }),
      // Top-level producer assets
      prisma.beat.deleteMany({ where: { producerId: id } }),
      prisma.collection.deleteMany({ where: { producerId: id } }),
      prisma.soundKit.deleteMany({ where: { producerId: id } }),
      prisma.merchProduct.deleteMany({ where: { producerId: id } }),
      prisma.merchService.deleteMany({ where: { producerId: id } }),
      // Beat requests (as requester)
      prisma.beatRequest.deleteMany({ where: { artistId: id } }),
      // User-level records
      prisma.payout.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.supportTicket.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      // Finally the user
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]]", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
