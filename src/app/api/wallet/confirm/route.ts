import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthUser } from "@/lib/apiAuth";
import { creditWalletTopUp } from "@/lib/wallet";

// POST /api/wallet/confirm — called by the client right after Stripe confirms a
// top-up, so the balance updates immediately instead of waiting on the webhook.
// The webhook still credits as a backup; the ledger prevents double credits.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentIntentId } = await req.json().catch(() => ({}));
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
  }

  try {
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata?.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await creditWalletTopUp(intent);
    if (result.status === "credited" || result.status === "already_credited") {
      return NextResponse.json({ ok: true, balance: result.balance });
    }
    if (result.status === "not_succeeded") {
      // e.g. "processing" for bank-based methods: the webhook will credit it later
      return NextResponse.json({ ok: false, pending: true, intentStatus: result.intentStatus });
    }
    return NextResponse.json({ error: "Not a wallet top-up" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not confirm top-up";
    console.error("[wallet/confirm]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
