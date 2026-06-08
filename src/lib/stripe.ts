import Stripe from 'stripe'

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_placeholder') {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key, {
    apiVersion: '2026-02-25.clover',
    maxNetworkRetries: 0,
    timeout: 8000,
  })
}

// Legacy singleton for routes that import `stripe` directly
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
  { apiVersion: '2026-02-25.clover', maxNetworkRetries: 0, timeout: 8000 }
)
