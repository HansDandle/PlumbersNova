import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

// PATCH /api/notifications/:id/read
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notification = await prisma.notification.findUnique({ where: { id: params.id } })
  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (notification.userId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { read: true },
  })

  return NextResponse.json({ data: updated })
}
