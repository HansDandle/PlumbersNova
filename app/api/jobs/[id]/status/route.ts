import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { UpdateJobStatusBody } from '@/types'

type Params = { params: { id: string } }

/**
 * PATCH /api/jobs/:id/status
 *
 * Advances or changes a job's status. When a technician marks a job
 * EN_ROUTE, the customer is automatically notified via the messaging
 * system (handled in a background job / queue — stubbed here).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: UpdateJobStatusBody = await req.json()

    const job = await prisma.job.update({
      where: { id: params.id },
      data: { status: body.status },
      include: { customer: true, technician: true },
    })

    // Trigger automated messaging side effects
    if (body.status === 'EN_ROUTE') {
      // TODO: enqueue SMS — "Your plumber is on the way and should arrive shortly."
    }

    if (body.status === 'COMPLETED') {
      // TODO: enqueue review request SMS after delay
    }

    return NextResponse.json({ data: job })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
