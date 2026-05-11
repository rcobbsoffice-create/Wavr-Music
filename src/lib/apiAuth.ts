import { cookies } from 'next/headers'
import { verifyToken } from './jwt'
import prisma from './prisma'
import type { User } from '@prisma/client'

export async function getAuthUser(requiredRole?: string): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('wavr-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  if (requiredRole && payload.role !== requiredRole) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.suspended) return null
  return user
}

export async function requireAuth(requiredRole?: string): Promise<User | Response> {
  const user = await getAuthUser(requiredRole)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}
