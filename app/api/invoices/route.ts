import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { CreateInvoiceBody } from '@/types'

// GET /api/invoices
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25')

  const where = status ? { status: status as any } : {}

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        job: { include: { customer: true } },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ])

  return NextResponse.json({ data: invoices, total, page, pageSize })
}

/**
 * POST /api/invoices
 *
 * Generates an invoice from the job's parts and labor entries.
 * Line items are built automatically from the job data.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: CreateInvoiceBody = await req.json()

    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      include: { parts: { include: { item: true } }, laborEntries: true, invoice: true },
    })

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.invoice) return NextResponse.json({ error: 'Invoice already exists' }, { status: 409 })

    const serviceCallAmount = body.serviceCallAmount ?? 0

    const lineItems = [
      ...(serviceCallAmount > 0
        ? [{ type: 'SERVICE_CALL' as const, description: 'Service Call', quantity: 1, unitPrice: serviceCallAmount, total: serviceCallAmount }]
        : []),
      ...job.laborEntries.map((l) => ({
        type: 'LABOR' as const,
        description: l.description,
        quantity: 1,
        unitPrice: l.amount,
        total: l.amount,
      })),
      ...job.parts.map((p) => ({
        type: 'PART' as const,
        description: p.item.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: p.quantity * p.unitPrice,
      })),
    ]

    const total = lineItems.reduce((sum, li) => sum + li.total, 0)

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          jobId: body.jobId,
          serviceCallAmount,
          total,
          lineItems: { create: lineItems },
        },
        include: { lineItems: true, job: { include: { customer: true } } },
      })

      await tx.job.update({
        where: { id: body.jobId },
        data: { status: 'INVOICED' },
      })

      return inv
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
