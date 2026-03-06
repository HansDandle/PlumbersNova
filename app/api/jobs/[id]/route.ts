import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { UpdateJobBody } from '@/types'

type Params = { params: { id: string } }

const JOB_INCLUDE = {
  customer: true,
  technician: { select: { id: true, name: true, phone: true } },
  lead: true,
  notes: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  photos: { orderBy: { createdAt: 'asc' as const } },
  parts: {
    include: { item: true, sourceLocation: true },
    orderBy: { createdAt: 'asc' as const },
  },
  laborEntries: { orderBy: { createdAt: 'asc' as const } },
  invoice: { include: { lineItems: true } },
}

// GET /api/jobs/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: JOB_INCLUDE,
  })

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Technicians may only access their own jobs
  if (session.role === 'TECHNICIAN' && job.technicianId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data: job })
}

// PATCH /api/jobs/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: UpdateJobBody = await req.json()

    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...body,
        scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : undefined,
        scheduledEndTime: body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined,
      },
      include: JOB_INCLUDE,
    })

    return NextResponse.json({ data: job })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
