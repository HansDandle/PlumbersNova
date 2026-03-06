import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { AddLaborEntryBody } from '@/types'

type Params = { params: { id: string } }

// GET /api/jobs/:id/labor
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findFirst({ where: { id: params.id, companyId: session.companyId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const entries = await prisma.laborEntry.findMany({
    where: { jobId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: entries })
}

// POST /api/jobs/:id/labor
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: AddLaborEntryBody = await req.json()

    const job = await prisma.job.findFirst({ where: { id: params.id, companyId: session.companyId } })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const entry = await prisma.laborEntry.create({
      data: {
        jobId: params.id,
        description: body.description,
        amount: body.amount,
      },
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
