import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

// GET /api/inventory/items/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id },
    include: {
      balances: {
        include: { location: true },
        orderBy: { location: { name: 'asc' } },
      },
    },
  })

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: item })
}

// PATCH /api/inventory/items/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: { name?: string; sku?: string; category?: string; cost?: number; defaultPrice?: number } = await req.json()
    const item = await prisma.inventoryItem.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ data: item })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/inventory/items/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.inventoryItem.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { ok: true } })
}
