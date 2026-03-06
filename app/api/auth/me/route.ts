import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/auth/me
export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ data: user })
}

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ data: { ok: true } })
  response.cookies.delete('session')
  return response
}
