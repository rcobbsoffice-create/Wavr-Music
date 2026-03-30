import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" });

interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

// POST /api/cart/checkout — create Stripe Checkout session for merch cart
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { items, shippingAddress } = await req.json() as { items: CartItem[]; shippingAddress?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Load products
    const productIds = items.map((i) => i.productId);
    const products = await prisma.merchProduct.findMany({
      where: { id: { in: productIds }, status: "active" },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Build Stripe line items
    const lineItems = items.map((item) => {
      const product = productMap[item.productId];
      return {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name + (item.size ? ` (${item.size})` : ""),
            images: (() => { try { const imgs = JSON.parse(product.images); return imgs.slice(0, 1); } catch { return []; } })(),
          },
        },
        quantity: item.quantity,
      };
    });

    const total = items.reduce((sum, item) => {
      return sum + productMap[item.productId].price * item.quantity;
    }, 0);

    // Encode cart + address in metadata
    const metadata = {
      userId: user.id,
      items: JSON.stringify(items),
      shippingAddress: shippingAddress ?? "{}",
      total: String(Math.round(total * 100) / 100),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?type=merch`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/merch`,
      customer_email: user.email,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[POST /api/cart/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
