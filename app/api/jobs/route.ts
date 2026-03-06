import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { CreateJobBody } from '@/types'

// GET /api/jobs
// Query params: status, technicianId, date (ISO date string), page, pageSize
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const technicianId = searchParams.get('technicianId')
  const date = searchParams.get('date')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25')

  // Technicians can only see their own jobs
  const effectiveTechnicianId =
    session.role === 'TECHNICIAN' ? session.id : (technicianId ?? undefined)

  const where: any = {
    ...(status ? { status } : {}),
    ...(effectiveTechnicianId ? { technicianId: effectiveTechnicianId } : {}),
    ...(date
      ? {
          scheduledTime: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lt: new Date(`${date}T23:59:59.999Z`),
          },
        }
      : {}),
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        customer: true,
        technician: { select: { id: true, name: true, phone: true } },
        invoice: { select: { id: true, status: true, total: true } },
      },
      orderBy: { scheduledTime: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ])

  return NextResponse.json({ data: jobs, total, page, pageSize })
}

// POST /api/jobs
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: CreateJobBody = await req.json()

    const job = await prisma.job.create({
      data: {
        customerId: body.customerId,
        address: body.address,
        problemDescription: body.problemDescription,
        technicianId: body.technicianId,
        scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : undefined,
        scheduledEndTime: body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined,
        leadId: body.leadId,
      },
      include: { customer: true, technician: true },
    })

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
