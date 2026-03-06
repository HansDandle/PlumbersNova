import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { ConvertLeadBody } from '@/types'

type Params = { params: { id: string } }

/**
 * POST /api/leads/:id/convert
 *
 * Converts a lead into a Job. Creates or links a Customer record,
 * creates the Job, and marks the lead as CONVERTED.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lead = await prisma.lead.findFirst({ where: { id: params.id, companyId: session.companyId } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.status === 'CONVERTED') {
    return NextResponse.json({ error: 'Lead already converted' }, { status: 409 })
  }

  try {
    const body: ConvertLeadBody = await req.json()

    const result = await prisma.$transaction(async (tx) => {
      // Upsert customer by phone number
      let customer = lead.customerId
        ? await tx.customer.findUnique({ where: { id: lead.customerId } })
        : null

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            companyId: session.companyId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email ?? undefined,
            address: body.address ?? lead.address,
          },
        })
      } else if (lead.email && !customer.email) {
        // Backfill email if the existing customer record is missing it
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { email: lead.email },
        })
      }

      const job = await tx.job.create({
        data: {
          companyId: session.companyId,
          leadId: lead.id,
          customerId: customer.id,
          address: body.address ?? lead.address ?? customer.address ?? '',
          problemDescription: lead.description,
          technicianId: body.technicianId,
          scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : undefined,
          status: body.technicianId ? 'TECHNICIAN_ASSIGNED' : (body.scheduledTime ? 'SCHEDULED' : 'JOB_REQUESTED'),
        },
        include: { customer: true, technician: true },
      })

      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'CONVERTED', customerId: customer.id },
      })

      return job
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
