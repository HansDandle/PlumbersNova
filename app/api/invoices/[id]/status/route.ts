import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { UpdateInvoiceStatusBody } from '@/types'

type Params = { params: { id: string } }

/**
 * PATCH /api/invoices/:id/status
 *
 * Marks an invoice as SENT or PAID.
 * When set to PAID, the linked job status is also updated to PAID.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: UpdateInvoiceStatusBody = await req.json()

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: params.id },
        data: { status: body.status },
        include: { job: true },
      })

      if (body.status === 'PAID') {
        await tx.job.update({
          where: { id: inv.jobId },
          data: { status: 'PAID' },
        })
      }

      return inv
    })

    return NextResponse.json({ data: invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
