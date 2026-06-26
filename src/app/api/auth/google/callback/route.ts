import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { getDashboardPath } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").trim();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_cancelled`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
    }

    // Get user profile from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_no_email`);
    }

    const email = profile.email.toLowerCase().trim();

    // Role hint passed via OAuth state param (from signup page)
    const stateRole = req.nextUrl.searchParams.get("state");
    const roleHint = stateRole === "producer" || stateRole === "artist" ? stateRole : null;

    // Existing user — log them straight in
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.suspended) {
        return NextResponse.redirect(`${baseUrl}/login?error=suspended`);
      }

      const token = signToken({ userId: existingUser.id, role: existingUser.role, email: existingUser.email });
      const res = NextResponse.redirect(`${baseUrl}${getDashboardPath(existingUser.role)}`);

      res.cookies.set("wavr-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      res.cookies.set("wavr-role", existingUser.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // New user — if we have a role hint, create account immediately
    if (roleHint) {
      const { default: bcrypt } = await import("bcryptjs");
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          name: profile.name ?? email.split("@")[0],
          password: randomPassword,
          role: roleHint,
          verified: true,
          avatar: profile.picture ?? null,
        },
      });

      const token = signToken({ userId: newUser.id, role: newUser.role, email: newUser.email });
      const res = NextResponse.redirect(`${baseUrl}${getDashboardPath(newUser.role)}`);

      res.cookies.set("wavr-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      res.cookies.set("wavr-role", newUser.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // New user, no role hint — store profile in temp cookie and show role picker
    const pending = JSON.stringify({
      email,
      name: profile.name ?? email.split("@")[0],
      avatar: profile.picture ?? null,
    });

    const res = NextResponse.redirect(`${baseUrl}/onboarding/role`);
    res.cookies.set("wavr-google-pending", pending, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return res;
  } catch (err) {
    console.error("[Google OAuth callback]", err);
    return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
  }
}
