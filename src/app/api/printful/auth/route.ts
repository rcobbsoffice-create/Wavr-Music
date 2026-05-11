import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = process.env.PRINTFUL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Printful Client ID not configured" }, { status: 500 });
  }

  // Generate a random state to prevent CSRF
  const state = Math.random().toString(36).substring(7);

  // You can pass the state to the redirect URL if you want to verify it in the callback
  const authUrl = `https://www.printful.com/oauth/auth?client_id=${clientId}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
