import type Stripe from "stripe";
import prisma from "@/lib/prisma";

export type CreditResult =
  | { status: "credited" | "already_credited"; balance: number }
  | { status: "not_succeeded"; intentStatus: string }
  | { status: "not_wallet_topup" };

/**
 * Credit a succeeded wallet top-up PaymentIntent to its user's balance exactly once.
 *
 * Safe to call from the webhook, the saved-card charge route and the client
 * confirm route at the same time: the ledger row's unique stripePaymentId
 * means only the first caller increments the balance.
 */
export async function creditWalletTopUp(intent: Stripe.PaymentIntent): Promise<CreditResult> {
  const userId = intent.metadata?.userId;
  if (intent.metadata?.type !== "wallet_topup" || !userId) return { status: "not_wallet_topup" };
  if (intent.status !== "succeeded") return { status: "not_succeeded", intentStatus: intent.status };

  // Trust what Stripe actually collected, not the metadata string.
  const amount = Math.round(intent.amount_received) / 100;

  try {
    const [, user] = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: { userId, amount, type: "topup", stripePaymentId: intent.id },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
        select: { balance: true },
      }),
    ]);
    return { status: "credited", balance: user.balance };
  } catch (err) {
    // P2002 = unique constraint: this PaymentIntent was already credited
    if ((err as { code?: string })?.code === "P2002") {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { status: "already_credited", balance: user?.balance ?? 0 };
    }
    throw err;
  }
}
