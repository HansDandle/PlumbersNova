import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

// GET /api/invoices/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      lineItems: true,
      job: {
        include: {
          customer: true,
          technician: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: invoice })
}
