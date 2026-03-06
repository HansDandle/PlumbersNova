import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/messages
// Query params: customerId, leadId
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const customerId = searchParams.get('customerId')
  const leadId = searchParams.get('leadId')

  const messages = await prisma.message.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(leadId ? { leadId } : {}),
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: messages })
}

// POST /api/messages/send
// Used by office staff to manually send an outbound SMS
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: {
      content: string
      customerId?: string
      leadId?: string
      channel?: 'SMS' | 'EMAIL'
    } = await req.json()

    // TODO: trigger actual SMS via Twilio / provider
    // await twilioClient.messages.create({ ... })

    const message = await prisma.message.create({
      data: {
        content: body.content,
        direction: 'OUTBOUND',
        channel: body.channel ?? 'SMS',
        customerId: body.customerId,
        leadId: body.leadId,
      },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
