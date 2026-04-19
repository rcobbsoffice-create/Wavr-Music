import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(tickets.map((t) => ({
    id: t.id,
    userName: t.user.name,
    userEmail: t.user.email,
    subject: t.subject,
    message: t.message,
    status: t.status,
    priority: t.priority,
    response: t.response,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  })));
}
