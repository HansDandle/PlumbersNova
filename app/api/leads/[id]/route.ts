import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { UpdateLeadBody } from '@/types'

type Params = { params: { id: string } }

// GET /api/leads/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { customer: true, messages: { orderBy: { createdAt: 'asc' } }, job: true },
  })

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: lead })
}

// PATCH /api/leads/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: UpdateLeadBody = await req.json()

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: body,
      include: { customer: true },
    })

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/leads/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.lead.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { ok: true } })
}
