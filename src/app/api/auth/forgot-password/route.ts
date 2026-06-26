import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always return success to avoid revealing whether an account exists
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpiry: expiry },
    });

    await sendEmail({
      to: user.email,
      subject: "Reset your WAVR password",
      html: emailTemplates.passwordReset(user.name, token),
    }).catch((err) => console.error("[forgot-password] email error:", err));
  }

  return NextResponse.json({ ok: true });
}
