import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/auth/logout-redirect — clears session cookie and redirects to /login
// Used by the app layout when a stale (pre-companyId) session is detected
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url))
  res.cookies.set('session', '', { httpOnly: true, expires: new Date(0), path: '/' })
  return res
}
