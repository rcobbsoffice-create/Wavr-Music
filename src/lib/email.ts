import nodemailer from 'nodemailer'

async function getTransporter() {
  if (process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT ?? 587),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  }
  // Dev fallback: create ethereal test account
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = await getTransporter()
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@wavr.com',
    to,
    subject,
    html,
  })
  console.log('Email sent:', info.messageId)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
  }
  return info
}

export const emailTemplates = {
  welcome: (name: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#a855f7">Welcome to WAVR, ${name}!</h1>
      <p>Your account has been created. Start listing beats, selling licenses, and dropping merch today.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login" style="background:#a855f7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Get Started</a>
    </div>
  `,
  verifyEmail: (name: string, token: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#a855f7">Verify your email, ${name}</h1>
      <p style="color:#9ca3af;margin:16px 0">You&apos;re almost set! Click the button below to verify your email address and activate your WAVR account.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify-email?token=${token}" style="background:#a855f7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px;font-weight:bold">Verify Email Address</a>
      <p style="color:#6b7280;font-size:13px;margin-top:32px">This link expires in 24 hours. If you didn&apos;t create a WAVR account, you can ignore this email.</p>
    </div>
  `,
  passwordReset: (name: string, token: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#a855f7">Reset Your Password</h1>
      <p>Hi ${name}, click below to reset your password. Link expires in 1 hour.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}" style="background:#a855f7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Reset Password</a>
    </div>
  `,
  beatPurchase: (buyerName: string, beatTitle: string, licenseType: string, amount: number) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#a855f7">Purchase Confirmed!</h1>
      <p>Hi ${buyerName}, you&apos;ve purchased a ${licenseType} license for &quot;${beatTitle}&quot;.</p>
      <p style="color:#a855f7;font-size:24px;font-weight:bold">$${amount}</p>
      <p>Your license file is available in your dashboard.</p>
    </div>
  `,
  orderShipped: (name: string, trackingNumber: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;padding:40px;border-radius:12px">
      <h1 style="color:#a855f7">Your Order Shipped!</h1>
      <p>Hi ${name}, your merch order is on the way!</p>
      <p>Tracking: <strong>${trackingNumber}</strong></p>
    </div>
  `,
}
