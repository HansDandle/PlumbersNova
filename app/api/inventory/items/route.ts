import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { CreateInventoryItemBody } from '@/types'

// GET /api/inventory/items
// Query params: q (search), category, page, pageSize
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50')

  const where: any = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryItem.count({ where }),
  ])

  return NextResponse.json({ data: items, total, page, pageSize })
}

// POST /api/inventory/items
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: CreateInventoryItemBody = await req.json()
    const item = await prisma.inventoryItem.create({ data: body })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
