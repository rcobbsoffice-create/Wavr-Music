import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";

const SERVICES = {
  "setup": { name: "Pro Store Setup", price: 49.99 },
  "design-basic": { name: "Basic Logo/Graphic", price: 29.99 },
  "design-full": { name: "Collection Design", price: 149.99 },
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { serviceId, details } = await req.json();
    const service = SERVICES[serviceId as keyof typeof SERVICES];

    if (!service) {
      return NextResponse.json({ error: "Invalid service selected" }, { status: 400 });
    }

    // Check balance
    if (user.balance < service.price) {
      return NextResponse.json({ 
        error: `Insufficient balance. This service costs $${service.price}, but your balance is $${user.balance.toFixed(2)}.` 
      }, { status: 400 });
    }

    // Deduct balance and create service request
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: service.price } }
      }),
      prisma.merchService.create({
        data: {
          producerId: user.id,
          serviceType: serviceId,
          price: service.price,
          details: details || `Order for ${service.name}`,
          status: "pending"
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "merch_service",
          title: "Service Requested",
          message: `You have successfully requested the ${service.name} service. Our team will contact you shortly.`
        }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/merch/services]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.merchService.findMany({
    where: { producerId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(services);
}
