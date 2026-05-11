import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const user = await getAuthUser("admin");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalUsers,
    totalBeats,
    totalLicenses,
    totalRevenue,
    totalOrders,
    pendingPayouts,
    openTickets,
    recentUsers,
    recentLicenses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.beat.count(),
    prisma.license.count(),
    prisma.license.aggregate({ _sum: { price: true } }),
    prisma.order.count(),
    prisma.payout.count({ where: { status: "pending" } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { beat: { select: { title: true } }, buyer: { select: { name: true } } },
    }),
  ]);

  // Monthly revenue for last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyLicenses = await prisma.license.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { price: true, createdAt: true },
  });

  const monthMap: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
  }
  for (const lic of monthlyLicenses) {
    const d = new Date(lic.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthMap) monthMap[key] += lic.price;
  }
  const monthlyRevenue = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

  return NextResponse.json({
    totalUsers,
    totalBeats,
    totalLicenses,
    totalRevenue: Math.round((totalRevenue._sum.price ?? 0) * 100) / 100,
    totalOrders,
    pendingPayouts,
    openTickets,
    monthlyRevenue,
    recentUsers,
    recentLicenses: recentLicenses.map((l) => ({
      id: l.id,
      beatTitle: l.beat.title,
      buyerName: l.buyer.name,
      type: l.type,
      price: l.price,
      createdAt: l.createdAt,
    })),
  });
}
