import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { Role } from '@prisma/client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production'
)

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}

/**
 * Extract the authenticated user from a request.
 * Checks Authorization: Bearer header then falls back to session cookie.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7))
  }
  const token = req.cookies.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── Role guards ──────────────────────────────────────────────────────────────

export function requireRole(user: SessionUser, ...roles: Role[]): boolean {
  return roles.includes(user.role)
}
