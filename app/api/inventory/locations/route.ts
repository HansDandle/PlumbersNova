import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/inventory/locations
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  const locations = await prisma.inventoryLocation.findMany({
    where: type ? { type: type as any, companyId: session.companyId } : { companyId: session.companyId },
    include: { technician: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: locations })
}

// POST /api/inventory/locations
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: { name: string; type: 'WAREHOUSE' | 'TRUCK' | 'SUPPLY_HOUSE'; technicianId?: string } = await req.json()
    const location = await prisma.inventoryLocation.create({ data: { ...body, companyId: session.companyId } })
    return NextResponse.json({ data: location }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
