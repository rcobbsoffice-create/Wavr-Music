import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getAuthUser("admin");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const role = req.nextUrl.searchParams.get("role") ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";

  const users = await prisma.user.findMany({
    where: {
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      } : {}),
      ...(role ? { role } : {}),
      ...(status === "active" ? { suspended: false } : status === "suspended" ? { suspended: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, email: true, role: true, plan: true,
      suspended: true, verified: true, createdAt: true,
      _count: { select: { licenses: true } },
    },
  });

  // Get revenue per user via aggregation
  const beatRevenues = await prisma.license.findMany({
    select: { price: true, beat: { select: { producerId: true } } },
  });
  const revenueMap: Record<string, number> = {};
  for (const l of beatRevenues) {
    const pid = l.beat.producerId;
    revenueMap[pid] = (revenueMap[pid] ?? 0) + l.price;
  }

  return NextResponse.json(users.map((u) => ({
    ...u,
    revenue: Math.round((revenueMap[u.id] ?? 0) * 100) / 100,
    licensesBought: u._count.licenses,
  })));
}

export async function POST(req: NextRequest) {
  const admin = await getAuthUser("admin");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, role, plan } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const validRoles = ["producer", "artist", "admin"];
  const assignedRole = validRoles.includes(role) ? role : "producer";
  const validPlans = ["free", "pro", "label"];
  const assignedPlan = validPlans.includes(plan) ? plan : "free";

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: assignedRole, plan: assignedPlan, verified: true },
    select: { id: true, name: true, email: true, role: true, plan: true, suspended: true, verified: true, createdAt: true },
  });

  return NextResponse.json({ ...user, revenue: 0, licensesBought: 0 }, { status: 201 });
}
