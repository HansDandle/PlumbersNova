import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { AddJobPartBody } from '@/types'

type Params = { params: { id: string } }

// GET /api/jobs/:id/parts
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parts = await prisma.jobPart.findMany({
    where: { jobId: params.id },
    include: { item: true, sourceLocation: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: parts })
}

/**
 * POST /api/jobs/:id/parts
 *
 * Adds a part to the job and decrements inventory if sourced from
 * a TRUCK or WAREHOUSE location. Inventory is allowed to go negative.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: AddJobPartBody = await req.json()

    const result = await prisma.$transaction(async (tx) => {
      // Create the job part line item
      const part = await tx.jobPart.create({
        data: {
          jobId: params.id,
          itemId: body.itemId,
          quantity: body.quantity,
          unitPrice: body.unitPrice,
          sourceLocationId: body.sourceLocationId,
        },
        include: { item: true, sourceLocation: true },
      })

      // Decrement inventory if sourced from a tracked location (not SUPPLY_HOUSE)
      if (body.sourceLocationId) {
        const location = await tx.inventoryLocation.findUnique({
          where: { id: body.sourceLocationId },
        })

        if (location && location.type !== 'SUPPLY_HOUSE') {
          await tx.inventoryBalance.upsert({
            where: {
              locationId_itemId: {
                locationId: body.sourceLocationId,
                itemId: body.itemId,
              },
            },
            update: { quantity: { decrement: body.quantity } },
            create: {
              locationId: body.sourceLocationId,
              itemId: body.itemId,
              quantity: -body.quantity, // start negative if no prior balance
            },
          })
        }
      }

      return part
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
