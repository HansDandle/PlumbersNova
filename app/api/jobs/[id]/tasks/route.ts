import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/jobs/[id]/tasks
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      companyId: session.companyId,
      ...(session.role === 'TECHNICIAN' ? { technicianId: session.id } : {}),
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = await prisma.jobTask.findMany({
    where: { jobId: params.id },
    include: { priceBookTask: { select: { category: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(tasks)
}

// POST /api/jobs/[id]/tasks
// Body: { priceBookTaskId?, name, description?, quantity, unitPrice }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      companyId: session.companyId,
      ...(session.role === 'TECHNICIAN' ? { technicianId: session.id } : {}),
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { priceBookTaskId, name, description, quantity, unitPrice } = await req.json()
  if (!name || quantity == null || unitPrice == null)
    return NextResponse.json({ error: 'name, quantity, unitPrice required' }, { status: 400 })

  const qty = Number(quantity)
  const price = Number(unitPrice)
  const total = qty * price

  const task = await prisma.jobTask.create({
    data: {
      jobId: params.id,
      priceBookTaskId: priceBookTaskId ?? null,
      name,
      description: description ?? null,
      quantity: qty,
      unitPrice: price,
      total,
    },
    include: { priceBookTask: { select: { category: true } } },
  })

  return NextResponse.json(task, { status: 201 })
}
