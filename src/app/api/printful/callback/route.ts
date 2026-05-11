import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Printful OAuth Error:", error);
    return NextResponse.redirect(new URL("/producer?tab=merch&error=printful_auth_failed", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/producer?tab=merch", req.url));
  }

  try {
    const tokenRes = await fetch("https://www.printful.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.PRINTFUL_CLIENT_ID,
        client_secret: process.env.PRINTFUL_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Printful token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/producer?tab=merch&error=printful_token_failed", req.url));
    }

    // Save the token to the user
    await prisma.user.update({
      where: { id: user.id },
      data: { printfulToken: tokenData.access_token },
    });

    // Redirect back to dashboard merch tab with success
    return NextResponse.redirect(new URL("/producer?tab=merch&success=printful_connected", req.url));
  } catch (err) {
    console.error("Printful OAuth exception:", err);
    return NextResponse.redirect(new URL("/producer?tab=merch&error=printful_server_error", req.url));
  }
}
