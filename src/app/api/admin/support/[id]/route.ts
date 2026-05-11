import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, response } = await req.json();

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  const data: Record<string, unknown> = {};
  if (status && validStatuses.includes(status)) data.status = status;
  if (response !== undefined) data.response = response;

  const updated = await prisma.supportTicket.update({ where: { id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
}
