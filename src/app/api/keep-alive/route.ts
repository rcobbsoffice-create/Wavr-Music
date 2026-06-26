import { NextResponse } from "next/server";

const WORKER_URL = (process.env.STEMS_WORKER_URL ?? "").trim();

export const runtime = "edge";

export async function GET() {
  if (!WORKER_URL) {
    return NextResponse.json({ ok: false, reason: "STEMS_WORKER_URL not set" }, { status: 200 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${WORKER_URL}/`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch {
    // Worker is sleeping — ping still wakes it up, just takes 20-30s
    return NextResponse.json({ ok: false, waking: true });
  }
}
