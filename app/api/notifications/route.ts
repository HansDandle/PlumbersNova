import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/notifications
// Returns the current user's notifications, unread first
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return NextResponse.json({ data: notifications })
}
