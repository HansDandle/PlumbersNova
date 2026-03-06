import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/pricebook/[id]/materials
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await prisma.priceBookTask.findFirst({
    where: { id: params.id, companyId: session.companyId },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const materials = await prisma.priceBookTaskMaterial.findMany({
    where: { priceBookTaskId: params.id },
    include: {
      item: {
        select: {
          id: true,
          name: true,
          sku: true,
          cost: true,
          defaultPrice: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(materials)
}

// POST /api/pricebook/[id]/materials — owner/dispatcher only
// Body: { itemId, defaultQuantity }
export async function POST(
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

  const { itemId, defaultQuantity } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  // Verify item belongs to same company
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, companyId: session.companyId },
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const material = await prisma.priceBookTaskMaterial.upsert({
    where: { priceBookTaskId_itemId: { priceBookTaskId: params.id, itemId } },
    create: {
      priceBookTaskId: params.id,
      itemId,
      defaultQuantity: Number(defaultQuantity) || 1,
    },
    update: { defaultQuantity: Number(defaultQuantity) || 1 },
    include: { item: { select: { id: true, name: true, sku: true, cost: true, defaultPrice: true, category: true } } },
  })

  return NextResponse.json(material, { status: 201 })
}
