import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE /api/jobs/[id]/tasks/[taskId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify job belongs to company (and tech owns it if role = TECHNICIAN)
  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      companyId: session.companyId,
      ...(session.role === 'TECHNICIAN' ? { technicianId: session.id } : {}),
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.jobTask.delete({ where: { id: params.taskId } })

  return NextResponse.json({ ok: true })
}

// PATCH /api/jobs/[id]/tasks/[taskId] — update qty or price override
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
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

  const { quantity, unitPrice } = await req.json()
  const existingTask = await prisma.jobTask.findUnique({ where: { id: params.taskId } })
  if (!existingTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const qty = quantity != null ? Number(quantity) : existingTask.quantity
  const price = unitPrice != null ? Number(unitPrice) : existingTask.unitPrice

  const updated = await prisma.jobTask.update({
    where: { id: params.taskId },
    data: { quantity: qty, unitPrice: price, total: qty * price },
    include: { priceBookTask: { select: { category: true } } },
  })

  return NextResponse.json(updated)
}
