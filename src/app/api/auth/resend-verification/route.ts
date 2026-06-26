import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.verified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: { verifyToken },
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your WAVR email address",
    html: emailTemplates.verifyEmail(user.name, verifyToken),
  }).catch((err) => console.error("[resend-verification] email error:", err));

  return NextResponse.json({ ok: true });
}
