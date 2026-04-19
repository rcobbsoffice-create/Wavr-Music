import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All licenses for this producer's beats
  const licenses = await prisma.license.findMany({
    where: { beat: { producerId: user.id } },
    include: {
      beat: { select: { title: true } },
      buyer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Payouts
  const payouts = await prisma.payout.findMany({
    where: { userId: user.id },
    orderBy: { requestedAt: "desc" },
  });

  // Totals
  const totalEarnings = licenses.reduce((s, l) => s + l.price, 0);
  const beatsSold = licenses.length;
  const activeLicenses = licenses.filter((l) => l.type !== "exclusive").length;

  // Monthly revenue (current calendar month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = licenses
    .filter((l) => new Date(l.createdAt) >= monthStart)
    .reduce((s, l) => s + l.price, 0);

  // Recent sales (last 10)
  const recentSales = licenses.slice(0, 10).map((l) => ({
    beat: l.beat.title,
    buyer: l.buyer.name,
    license: l.type.charAt(0).toUpperCase() + l.type.slice(1),
    amount: l.price,
    date: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Top 5 beats by revenue
  const beatRevMap: Record<string, { name: string; revenue: number; sales: number }> = {};
  for (const l of licenses) {
    if (!beatRevMap[l.beatId]) {
      beatRevMap[l.beatId] = { name: l.beat.title, revenue: 0, sales: 0 };
    }
    beatRevMap[l.beatId].revenue += l.price;
    beatRevMap[l.beatId].sales += 1;
  }
  const topBeats = Object.values(beatRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly earnings for last 12 months
  const monthlyEarnings: number[] = Array(12).fill(0);
  for (const l of licenses) {
    const d = new Date(l.createdAt);
    const monthsAgo =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 12) {
      monthlyEarnings[11 - monthsAgo] += l.price;
    }
  }

  // Earnings by license type
  const earningsByType = { basic: 0, premium: 0, exclusive: 0 };
  for (const l of licenses) {
    if (l.type in earningsByType) {
      earningsByType[l.type as keyof typeof earningsByType] += l.price;
    }
  }

  // License agreements (for Licensing tab)
  const licenseAgreements = licenses.slice(0, 20).map((l) => ({
    beat: l.beat.title,
    buyer: l.buyer.name,
    type: l.type.charAt(0).toUpperCase() + l.type.slice(1),
    date: new Date(l.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: l.type === "exclusive" ? "Completed" : "Active",
    stripePaymentId: l.stripePaymentId,
  }));

  const payoutHistory = payouts.map((p) => ({
    date: new Date(p.requestedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    amount: p.amount,
    method: p.method === "paypal" ? "PayPal" : "Bank Transfer",
    status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
  }));

  return NextResponse.json({
    stats: { totalEarnings, beatsSold, activeLicenses, monthlyRevenue },
    recentSales,
    topBeats,
    monthlyEarnings,
    earningsByType,
    licenseAgreements,
    payoutHistory,
  });
}
