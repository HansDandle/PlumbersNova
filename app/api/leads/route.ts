import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { CreateLeadBody } from '@/types'

// GET /api/leads
// Query params: status, source, page, pageSize
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') as string | undefined
  const source = searchParams.get('source') as string | undefined
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25')

  const where = {
    companyId: session.companyId,
    ...(status ? { status: status as any } : {}),
    ...(source ? { source: source as any } : {}),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ])

  return NextResponse.json({ data: leads, total, page, pageSize })
}

// POST /api/leads
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: CreateLeadBody = await req.json()

    const lead = await prisma.lead.create({
      data: {
        companyId: session.companyId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        description: body.description,
        preferredTime: body.preferredTime,
        source: body.source ?? 'MANUAL',
        customerId: body.customerId,
      },
      include: { customer: true },
    })

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
