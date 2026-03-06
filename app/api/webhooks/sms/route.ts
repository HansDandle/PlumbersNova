import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  type SmsIntakeState,
  GREETING_MESSAGE,
  TWIML_EMPTY,
  processIntakeReply,
  twiml,
} from '@/lib/ai-intake'

/**
 * POST /api/webhooks/sms
 *
 * Receives inbound SMS from Twilio.
 *
 * Flow:
 *  1. Existing customer with no open lead → start AI intake (ask issue)
 *  2. Open lead mid-intake → advance state machine, extract data with GPT
 *  3. Intake complete → lead is fully populated, notify dispatchers
 *  4. Known customer with closed/converted lead → log & acknowledge
 *
 * Twilio sends form-encoded: From, To, Body
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string

    if (!from || !body) {
      return xml(TWIML_EMPTY, 400)
    }

    const normalizedPhone = from.replace(/\D/g, '')
    const last10 = normalizedPhone.slice(-10)

    // ── Resolve existing customer ─────────────────────────────────────────
    const customer = await prisma.customer.findFirst({
      where: { phone: { endsWith: last10 } },
    })

    // ── Log the inbound message ───────────────────────────────────────────
    const message = await prisma.message.create({
      data: {
        direction: 'INBOUND',
        channel: 'SMS',
        content: body,
        customerId: customer?.id,
      },
    })

    // ── Find any open lead for this number ────────────────────────────────
    const existingLead = await prisma.lead.findFirst({
      where: {
        phone: { endsWith: last10 },
        status: { in: ['NEW', 'CONTACTED'] },
      },
    })

    // ── CASE 1: Lead mid-intake — advance state machine ───────────────────
    if (existingLead) {
      await prisma.message.update({
        where: { id: message.id },
        data: { leadId: existingLead.id },
      })

      const currentState = (existingLead.smsIntakeState ?? {
        step: 'ASKING_ISSUE',
        collected: {},
      }) as SmsIntakeState

      // Already complete — generic acknowledgement
      if (currentState.step === 'COMPLETE') {
        return xml(
          twiml("We already have your info! We'll be in touch shortly."),
        )
      }

      const { nextState, twimlReply } = await processIntakeReply(currentState, body)

      // Persist updated state + collected data back onto the lead
      const leadUpdate: Record<string, unknown> = { smsIntakeState: nextState as unknown as Prisma.InputJsonValue }
      if (nextState.collected.address)  leadUpdate.address      = nextState.collected.address
      if (nextState.collected.issue)    leadUpdate.description  = nextState.collected.issue
      if (nextState.collected.preferredTime) leadUpdate.preferredTime = nextState.collected.preferredTime

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: leadUpdate,
      })

      // When intake completes, fire dispatcher notification
      if (nextState.step === 'COMPLETE') {
        await notifyDispatchers(existingLead.id)
      }

      return xml(twimlReply)
    }

    // ── CASE 2: No open lead — create one and start intake ────────────────
    const initialState: SmsIntakeState = {
      step: 'ASKING_ISSUE',
      collected: {},
      retries: 0,
    }

    const newLead = await prisma.lead.create({
      data: {
        name: customer?.name ?? 'Unknown',
        phone: from,
        description: body,           // raw first message as initial description
        source: 'SMS',
        customerId: customer?.id,
        smsIntakeState: initialState as unknown as Prisma.InputJsonValue,
        messages: { connect: { id: message.id } },
      },
    })

    console.log('New lead from SMS, starting intake:', newLead.id)

    return xml(twiml(GREETING_MESSAGE))
  } catch (err) {
    console.error('[webhooks/sms]', err)
    // Return empty TwiML so Twilio doesn't retry indefinitely
    return xml(TWIML_EMPTY)
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function xml(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

/** Create in-app notifications for all OWNER + DISPATCHER users. */
async function notifyDispatchers(leadId: string) {
  const dispatchers = await prisma.user.findMany({
    where: { role: { in: ['OWNER', 'DISPATCHER'] } },
    select: { id: true },
  })
  await prisma.notification.createMany({
    data: dispatchers.map((u) => ({
      userId: u.id,
      type: 'NEW_LEAD' as const,
      title: 'New SMS lead ready',
      message: `Lead ${leadId} collected via SMS intake is ready for review.`,
    })),
  })
}
