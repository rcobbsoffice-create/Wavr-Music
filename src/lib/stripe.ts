import Stripe from 'stripe'

const OPTS = { apiVersion: '2026-02-25.clover' as const, maxNetworkRetries: 0, timeout: 8000 }

export function getStripe(): Stripe {
  const key = (process.env.STRIPE_SECRET_KEY ?? '').trim()
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, OPTS)
}

export const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder').trim(),
  OPTS
)
