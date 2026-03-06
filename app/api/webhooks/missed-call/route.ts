import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/webhooks/missed-call
 *
 * Triggered by Twilio when an inbound call is not answered.
 * Automatically sends the caller an SMS:
 *   "Sorry we missed your call. What plumbing issue can we help with?"
 *
 * Twilio sends: From, To, CallSid (form-encoded)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string

    if (!from) {
      return NextResponse.json({ error: 'Missing From field' }, { status: 400 })
    }

    const AUTO_REPLY = "Sorry we missed your call. What plumbing issue can we help with?"

    // Find existing customer
    const normalizedPhone = from.replace(/\D/g, '')
    const customer = await prisma.customer.findFirst({
      where: { phone: { endsWith: normalizedPhone.slice(-10) } },
    })

    // Log the outbound auto-reply message
    await prisma.message.create({
      data: {
        direction: 'OUTBOUND',
        channel: 'SMS',
        content: AUTO_REPLY,
        customerId: customer?.id,
      },
    })

    // TODO: send SMS via Twilio SDK
    // await twilioClient.messages.create({
    //   to: from,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   body: AUTO_REPLY,
    // })

    // Respond with TwiML to reject/hangup gracefully
    return new NextResponse(
      `<Response><Reject reason="busy"/></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
