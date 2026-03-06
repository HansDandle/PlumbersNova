import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { sendInvoiceEmail } from '@/lib/email'
import type { InvoiceData } from '@/lib/invoice-pdf'
import type { UpdateInvoiceStatusBody } from '@/types'

type Params = { params: { id: string } }

/**
 * PATCH /api/invoices/:id/status
 *
 * Marks an invoice as SENT or PAID.
 * When SENT: generates a PDF and emails it to the customer.
 * When PAID: updates the linked job status to PAID.
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
        include: {
          job: {
            include: {
              customer: true,
            },
          },
          lineItems: true,
        },
      })

      if (body.status === 'PAID') {
        await tx.job.update({
          where: { id: inv.jobId },
          data: { status: 'PAID' },
        })
      }

      return inv
    })

    // ── Send PDF invoice by email when marked SENT ──────────────────────
    if (body.status === 'SENT') {
      const email =
        invoice.job.customer.email ??
        null

      if (email) {
        try {
          await sendInvoiceEmail(invoice as unknown as InvoiceData, email)
        } catch (emailErr) {
          // Non-fatal — invoice is still marked SENT even if email fails
          console.error('[invoice email]', emailErr)
        }
      } else {
        console.warn(`[invoice email] No email for customer ${invoice.job.customer.id} — skipping send`)
      }
    }

    return NextResponse.json({ data: invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
