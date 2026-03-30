import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'wavr-jwt-secret-change-in-production'

export function signToken(payload: { userId: string; role: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: string; role: string; email: string }
  } catch {
    return null
  }
}
