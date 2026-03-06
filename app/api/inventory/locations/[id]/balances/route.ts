import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { AdjustBalanceBody } from '@/types'

type Params = { params: { id: string } }

// GET /api/inventory/locations/:id/balances
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const balances = await prisma.inventoryBalance.findMany({
    where: { locationId: params.id },
    include: { item: true },
    orderBy: { item: { name: 'asc' } },
  })

  return NextResponse.json({ data: balances })
}

/**
 * PATCH /api/inventory/locations/:id/balances
 *
 * Adjusts a location's balance for a given item.
 * The quantity field is a delta (positive = add, negative = remove).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: AdjustBalanceBody = await req.json()

    const balance = await prisma.inventoryBalance.upsert({
      where: {
        locationId_itemId: {
          locationId: params.id,
          itemId: body.itemId,
        },
      },
      update: { quantity: { increment: body.quantity } },
      create: {
        locationId: params.id,
        itemId: body.itemId,
        quantity: body.quantity,
      },
      include: { item: true },
    })

    return NextResponse.json({ data: balance })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
