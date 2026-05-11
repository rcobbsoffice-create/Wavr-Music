const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM = process.env.FROM_EMAIL ?? 'noreply@wavr.com'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!RESEND_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send')
    return null
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[email] Resend error:', err)
    throw new Error(`Email send failed: ${err}`)
  }

  const data = await res.json()
  console.log('[email] Sent:', data.id)
  return data
}

const card = (content: string) => `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#f8fafc;padding:40px;border-radius:16px;border:1px solid #1e3a5f">
    <div style="margin-bottom:28px">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.05em;color:#fff">WAV<span style="color:#3b82f6">R</span></span>
    </div>
    ${content}
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1e3a5f;color:#64748b;font-size:12px">
      © ${new Date().getFullYear()} WAVR Music Inc. · <a href="${APP_URL}" style="color:#3b82f6">wavr.com</a>
    </div>
  </div>
`

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:20px">${label}</a>`

export const emailTemplates = {
  welcome: (name: string) => card(`
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px">Welcome to WAVR, ${name}!</h1>
    <p style="color:#94a3b8;line-height:1.6">Your account is ready. Start listing beats, selling licenses, and dropping merch today.</p>
    ${btn(`${APP_URL}/login`, 'Go to Dashboard')}
  `),

  verifyEmail: (name: string, token: string) => card(`
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px">Verify your email, ${name}</h1>
    <p style="color:#94a3b8;line-height:1.6">You're almost set! Click below to verify your email and activate your WAVR account.</p>
    ${btn(`${APP_URL}/verify-email?token=${token}`, 'Verify Email Address')}
    <p style="color:#64748b;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't create a WAVR account, ignore this email.</p>
  `),

  passwordReset: (name: string, token: string) => card(`
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px">Reset Your Password</h1>
    <p style="color:#94a3b8;line-height:1.6">Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
    ${btn(`${APP_URL}/reset-password?token=${token}`, 'Reset Password')}
  `),

  beatPurchase: (buyerName: string, beatTitle: string, licenseType: string, amount: number) => card(`
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px">Purchase Confirmed!</h1>
    <p style="color:#94a3b8;line-height:1.6">Hi ${buyerName}, you've licensed <strong style="color:#fff">"${beatTitle}"</strong> (${licenseType} license).</p>
    <p style="color:#3b82f6;font-size:28px;font-weight:900;margin:12px 0">$${amount}</p>
    <p style="color:#94a3b8">Your license is available in your dashboard.</p>
    ${btn(`${APP_URL}/dashboard`, 'View License')}
  `),

  orderShipped: (name: string, trackingNumber: string) => card(`
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px">Your Order Shipped!</h1>
    <p style="color:#94a3b8;line-height:1.6">Hi ${name}, your merch is on the way!</p>
    <p style="color:#94a3b8">Tracking: <strong style="color:#fff">${trackingNumber}</strong></p>
    ${btn(`${APP_URL}/dashboard`, 'View Order')}
  `),
}
