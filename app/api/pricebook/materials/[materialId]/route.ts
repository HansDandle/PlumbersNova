import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/pricebook/materials/[materialId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'DISPATCHER'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify ownership via task
  const material = await prisma.priceBookTaskMaterial.findFirst({
    where: { id: params.materialId, priceBookTask: { companyId: session.companyId } },
  })
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { defaultQuantity } = await req.json()
  const updated = await prisma.priceBookTaskMaterial.update({
    where: { id: params.materialId },
    data: { defaultQuantity: Number(defaultQuantity) || 1 },
    include: { item: { select: { id: true, name: true, sku: true, cost: true, defaultPrice: true, category: true } } },
  })

  return NextResponse.json(updated)
}

// DELETE /api/pricebook/materials/[materialId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'DISPATCHER'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const material = await prisma.priceBookTaskMaterial.findFirst({
    where: { id: params.materialId, priceBookTask: { companyId: session.companyId } },
  })
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.priceBookTaskMaterial.delete({ where: { id: params.materialId } })
  return NextResponse.json({ ok: true })
}
