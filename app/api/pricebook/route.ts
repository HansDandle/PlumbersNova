import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/pricebook?search=&category=&activeOnly=true
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const activeOnly = searchParams.get('activeOnly') !== 'false'

  const tasks = await prisma.priceBookTask.findMany({
    where: {
      companyId: session.companyId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(tasks)
}

// POST /api/pricebook — owner/dispatcher only
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'DISPATCHER'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { category, name, description, unitPrice } = await req.json()
  if (!category || !name || unitPrice == null)
    return NextResponse.json({ error: 'category, name, unitPrice required' }, { status: 400 })

  const task = await prisma.priceBookTask.create({
    data: {
      companyId: session.companyId,
      category,
      name,
      description: description ?? null,
      unitPrice: Number(unitPrice),
      isActive: true,
    },
  })

  return NextResponse.json(task, { status: 201 })
}
