import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string; partId: string } }

/**
 * DELETE /api/jobs/:id/parts/:partId
 *
 * Removes a part from the job and restores the inventory balance
 * if the part was sourced from a TRUCK or WAREHOUSE location.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({ where: { id: params.id, companyId: session.companyId } })
      if (!job) return

      const part = await tx.jobPart.findUnique({ where: { id: params.partId } })
      if (!part) return

      // Restore inventory
      if (part.sourceLocationId) {
        const location = await tx.inventoryLocation.findUnique({
          where: { id: part.sourceLocationId },
        })
        if (location && location.type !== 'SUPPLY_HOUSE') {
          await tx.inventoryBalance.upsert({
            where: {
              locationId_itemId: {
                locationId: part.sourceLocationId,
                itemId: part.itemId,
              },
            },
            update: { quantity: { increment: part.quantity } },
            create: {
              locationId: part.sourceLocationId,
              itemId: part.itemId,
              quantity: part.quantity,
            },
          })
        }
      }

      await tx.jobPart.delete({ where: { id: params.partId } })
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
