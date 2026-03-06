import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/me/truck-locations?itemIds=a,b,c
 *
 * Returns all truck (and warehouse) inventory locations for the company,
 * along with their balances for the requested items.
 * Technicians see only their own truck + warehouse locations.
 * Owners/dispatchers see all truck locations.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawIds = new URL(req.url).searchParams.get('itemIds') ?? ''
  const itemIds = rawIds ? rawIds.split(',').filter(Boolean) : []

  // For technicians, show only their truck + shared warehouses.
  // For owners/dispatchers, show all locations.
  const locations = await prisma.inventoryLocation.findMany({
    where: {
      companyId: session.companyId,
      type: { in: ['TRUCK', 'WAREHOUSE'] },
      ...(session.role === 'TECHNICIAN' ? {
        OR: [
          { technicianId: session.id },
          { technicianId: null }, // shared warehouses
        ],
      } : {}),
    },
    include: {
      balances: itemIds.length > 0
        ? { where: { itemId: { in: itemIds } }, include: { item: { select: { id: true, name: true, sku: true } } } }
        : { include: { item: { select: { id: true, name: true, sku: true } } } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(locations)
}
