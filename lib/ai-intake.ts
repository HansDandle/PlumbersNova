/**
 * lib/ai-intake.ts
 *
 * AI-powered SMS lead intake using OpenAI.
 *
 * The conversation walks a new SMS contact through three questions:
 *   1. What plumbing issue are you having?
 *   2. What is your address?
 *   3. When would you like service?
 *
 * Conversation state is stored as JSON on Lead.smsIntakeState so it
 * survives server restarts and scales across instances.
 */

import Groq from 'groq-sdk'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SmsIntakeStep =
  | 'GREETING'       // lead just created, first question sent
  | 'ASKING_ISSUE'   // waiting for problem description
  | 'ASKING_ADDRESS' // waiting for service address
  | 'ASKING_TIME'    // waiting for preferred time
  | 'COMPLETE'       // all data collected

export interface SmsCollected {
  issue?: string
  address?: string
  preferredTime?: string
}

export interface SmsIntakeState {
  step: SmsIntakeStep
  collected: SmsCollected
  /** number of times we've nudged without a parseable answer */
  retries?: number
}

// ─────────────────────────────────────────────
// Groq client (lazy — only instantiated if API key present)
// ─────────────────────────────────────────────

function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

// ─────────────────────────────────────────────
// Extraction helpers
// ─────────────────────────────────────────────

/**
 * Ask GPT to pull a single field out of a freeform SMS reply.
 * Returns null if the model cannot confidently extract anything.
 */
async function extract(
  field: 'plumbing_issue' | 'address' | 'preferred_time',
  userMessage: string,
): Promise<string | null> {
  const fieldDescriptions: Record<typeof field, string> = {
    plumbing_issue:
      'the plumbing problem the customer is describing (e.g. "leaking pipe under sink", "no hot water", "toilet won\'t flush")',
    address:
      'the full service address including street, city, and state if mentioned. Return the address exactly as stated.',
    preferred_time:
      'when the customer wants service (e.g. "tomorrow morning", "next Tuesday", "as soon as possible", "anytime this week")',
  }

  const groq = getGroq()

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are extracting structured data from an SMS message sent to a plumbing company.
Extract only this field: ${fieldDescriptions[field]}.
Respond with JSON: {"value": "<extracted text>"} or {"value": null} if you cannot extract it.
Keep the value concise, clean, and exactly as the customer stated it.`,
      },
      { role: 'user', content: userMessage },
    ],
  })

  const raw = response.choices[0].message.content ?? '{}'
  try {
    const parsed = JSON.parse(raw) as { value: string | null }
    return parsed.value ?? null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// Conversation state machine
// ─────────────────────────────────────────────

export const GREETING_MESSAGE =
  "Hi! Thanks for reaching out to us. To get you set up, could you briefly describe the plumbing issue you're having?"

const PROMPTS: Record<SmsIntakeStep, string | null> = {
  GREETING: GREETING_MESSAGE,
  ASKING_ISSUE: "Got it — what's the address where you need service?",
  ASKING_ADDRESS: "Perfect. When would you like us to come out? (e.g. tomorrow morning, next Tuesday, ASAP)",
  ASKING_TIME: "Great! We'll have someone contact you shortly to confirm the details. Talk soon!",
  COMPLETE: null,
}

const RETRY_PROMPTS: Record<SmsIntakeStep, string | null> = {
  GREETING: null,
  ASKING_ISSUE:
    "Sorry, I didn't quite catch that. Could you describe the plumbing problem you're experiencing?",
  ASKING_ADDRESS:
    "Could you share the street address where you need service?",
  ASKING_TIME:
    "Just let us know when works best for you — even \"ASAP\" or \"flexible\" is fine!",
  COMPLETE: null,
}

/**
 * Process an inbound SMS for a lead that is mid-intake.
 *
 * @param currentState  The current smsIntakeState stored on the lead (may be null for the very first reply).
 * @param incomingText  The raw SMS body from the customer.
 * @returns            Updated state + the TwiML reply string to return to Twilio.
 */
export async function processIntakeReply(
  currentState: SmsIntakeState,
  incomingText: string,
): Promise<{ nextState: SmsIntakeState; twimlReply: string }> {
  const state = { ...currentState, collected: { ...currentState.collected } }
  const retries = state.retries ?? 0

  // ── Step: ASKING_ISSUE ──────────────────────────────────────────────────
  if (state.step === 'ASKING_ISSUE') {
    const issue = await extract('plumbing_issue', incomingText)
    if (issue) {
      state.collected.issue = issue
      state.step = 'ASKING_ADDRESS'
      state.retries = 0
      return { nextState: state, twimlReply: twiml(PROMPTS.ASKING_ISSUE!) }
    }
    // Could not parse — nudge once, then accept raw text
    if (retries < 1) {
      state.retries = retries + 1
      return { nextState: state, twimlReply: twiml(RETRY_PROMPTS.ASKING_ISSUE!) }
    }
    // Accept raw after one retry
    state.collected.issue = incomingText.trim()
    state.step = 'ASKING_ADDRESS'
    state.retries = 0
    return { nextState: state, twimlReply: twiml(PROMPTS.ASKING_ISSUE!) }
  }

  // ── Step: ASKING_ADDRESS ────────────────────────────────────────────────
  if (state.step === 'ASKING_ADDRESS') {
    const address = await extract('address', incomingText)
    if (address) {
      state.collected.address = address
      state.step = 'ASKING_TIME'
      state.retries = 0
      return { nextState: state, twimlReply: twiml(PROMPTS.ASKING_ADDRESS!) }
    }
    if (retries < 1) {
      state.retries = retries + 1
      return { nextState: state, twimlReply: twiml(RETRY_PROMPTS.ASKING_ADDRESS!) }
    }
    state.collected.address = incomingText.trim()
    state.step = 'ASKING_TIME'
    state.retries = 0
    return { nextState: state, twimlReply: twiml(PROMPTS.ASKING_ADDRESS!) }
  }

  // ── Step: ASKING_TIME ───────────────────────────────────────────────────
  if (state.step === 'ASKING_TIME') {
    const preferredTime = await extract('preferred_time', incomingText)
    state.collected.preferredTime = preferredTime ?? incomingText.trim()
    state.step = 'COMPLETE'
    state.retries = 0
    return { nextState: state, twimlReply: twiml(PROMPTS.ASKING_TIME!) }
  }

  // ── Already COMPLETE — acknowledge and stop ─────────────────────────────
  return {
    nextState: state,
    twimlReply: twiml(
      "We already have your info and will be in touch soon. Call us if you need anything urgent!",
    ),
  }
}

/**
 * Wrap a plain-text message in Twilio TwiML so the webhook response
 * triggers an outbound SMS automatically.
 */
export function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`
}

/** Empty TwiML — tells Twilio to do nothing (no reply). */
export const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
