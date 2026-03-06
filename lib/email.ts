/**
 * lib/email.ts
 *
 * Email utilities using Resend (resend.com — free tier: 3,000/month).
 */

import { Resend } from 'resend'
import type { InvoiceData } from './invoice-pdf'
import { generateInvoicePdf } from './invoice-pdf'

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'invoices@yourdomain.com'
const COMPANY = process.env.COMPANY_NAME ?? 'PlumbersNova'

// ─────────────────────────────────────────────
// Send Invoice
// ─────────────────────────────────────────────

export async function sendInvoiceEmail(
  invoice: InvoiceData,
  toEmail: string,
): Promise<void> {
  const resend = getResend()
  const invoiceNumber = invoice.id.slice(-8).toUpperCase()
  const pdfBuffer = await generateInvoicePdf(invoice)

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Your invoice from ${COMPANY} — #${invoiceNumber}`,
    html: buildInvoiceHtml(invoice, invoiceNumber),
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}

// ─────────────────────────────────────────────
// Plain HTML email body (fallback for email clients that don't show attachments inline)
// ─────────────────────────────────────────────

function buildInvoiceHtml(invoice: InvoiceData, invoiceNumber: string): string {
  const lineItemRows = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">$${item.total.toFixed(2)}</td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice #${invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
    <div>
      <h1 style="margin:0;color:#1d4ed8;font-size:24px">${COMPANY}</h1>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0;font-size:20px">Invoice #${invoiceNumber}</h2>
      <p style="margin:4px 0;color:#6b7280;font-size:13px">
        ${new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  </div>

  <p style="font-size:15px;margin-bottom:24px">
    Hi ${invoice.job.customer.name}, please find your invoice attached. Here's a summary:
  </p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Description</th>
        <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280">Qty</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280">Unit Price</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280">Total</th>
      </tr>
    </thead>
    <tbody>${lineItemRows}</tbody>
  </table>

  <div style="text-align:right;margin-bottom:32px">
    <span style="font-size:16px;font-weight:bold">Total Due: </span>
    <span style="font-size:18px;font-weight:bold;color:#1d4ed8">$${invoice.totalAmount.toFixed(2)}</span>
  </div>

  <p style="color:#6b7280;font-size:13px">
    Service address: ${invoice.job.address}<br>
    Job: ${invoice.job.problemDescription}
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">

  <p style="color:#9ca3af;font-size:12px;text-align:center">
    Thank you for choosing ${COMPANY}!<br>
    Please reply to this email with any questions.
  </p>
</body>
</html>`
}
