import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

// GET /api/customers/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      jobs: {
        include: { invoice: { select: { id: true, status: true, total: true } } },
        orderBy: { createdAt: 'desc' },
      },
      leads: { orderBy: { createdAt: 'desc' } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: customer })
}

// PATCH /api/customers/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: { name?: string; phone?: string; address?: string; email?: string } = await req.json()
    const customer = await prisma.customer.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ data: customer })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
