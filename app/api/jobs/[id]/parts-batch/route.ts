import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type PartInput = {
  itemId: string
  quantity: number
  unitPrice: number
  sourceLocationId?: string | null
  // if sourceLocationId is null AND fieldPurchased is true → supply house purchase, no decrement
  fieldPurchased?: boolean
}

/**
 * POST /api/jobs/[id]/parts-batch
 *
 * Adds multiple parts to a job in a single transaction.
 * For each part with a sourceLocationId from a TRUCK/WAREHOUSE,
 * decrements the inventory balance.
 * Field-purchased parts (no sourceLocationId) are added without decrement.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      companyId: session.companyId,
      ...(session.role === 'TECHNICIAN' ? { technicianId: session.id } : {}),
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { parts }: { parts: PartInput[] } = await req.json()
  if (!Array.isArray(parts) || parts.length === 0)
    return NextResponse.json({ error: 'parts array required' }, { status: 400 })

  const created = await prisma.$transaction(async (tx) => {
    const results = []

    for (const p of parts) {
      const part = await tx.jobPart.create({
        data: {
          jobId: params.id,
          itemId: p.itemId,
          quantity: Number(p.quantity),
          unitPrice: Number(p.unitPrice),
          sourceLocationId: p.sourceLocationId ?? null,
        },
        include: { item: true, sourceLocation: true },
      })
      results.push(part)

      // Decrement inventory only if sourced from tracked location
      if (p.sourceLocationId) {
        const location = await tx.inventoryLocation.findUnique({
          where: { id: p.sourceLocationId },
        })
        if (location && location.type !== 'SUPPLY_HOUSE') {
          await tx.inventoryBalance.upsert({
            where: { locationId_itemId: { locationId: p.sourceLocationId, itemId: p.itemId } },
            update: { quantity: { decrement: Number(p.quantity) } },
            create: {
              locationId: p.sourceLocationId,
              itemId: p.itemId,
              quantity: -Number(p.quantity),
            },
          })
        }
      }
    }

    return results
  })

  return NextResponse.json({ data: created }, { status: 201 })
}
