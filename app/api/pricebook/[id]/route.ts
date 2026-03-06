import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/pricebook/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'DISPATCHER'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const task = await prisma.priceBookTask.findFirst({
    where: { id: params.id, companyId: session.companyId },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await req.json()
  const updated = await prisma.priceBookTask.update({
    where: { id: params.id },
    data: {
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.unitPrice !== undefined ? { unitPrice: Number(data.unitPrice) } : {}),
      ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/pricebook/[id] — soft-deactivates
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'DISPATCHER'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const task = await prisma.priceBookTask.findFirst({
    where: { id: params.id, companyId: session.companyId },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.priceBookTask.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
