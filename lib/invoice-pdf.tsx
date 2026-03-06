/**
 * lib/invoice-pdf.tsx
 *
 * Generates a PDF buffer for an invoice using @react-pdf/renderer.
 * Call generateInvoicePdf(invoice) server-side (API routes, server actions).
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'

// ─────────────────────────────────────────────
// Types (mirrors Prisma include shape used in the status route)
// ─────────────────────────────────────────────

export interface InvoiceLineItemData {
  id: string
  type: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoiceData {
  id: string
  status: string
  totalAmount: number
  createdAt: Date | string
  lineItems: InvoiceLineItemData[]
  job: {
    address: string
    problemDescription: string
    customer: {
      name: string
      email?: string | null
      phone: string
      address?: string | null
    }
  }
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
    padding: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  company: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#111827',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '6 8',
    marginBottom: 2,
    borderRadius: 3,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    padding: '5 8',
  },
  totalsLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginRight: 24,
  },
  totalsValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    width: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

// ─────────────────────────────────────────────
// PDF Component
// ─────────────────────────────────────────────

function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  const companyName = process.env.COMPANY_NAME ?? 'PlumbersNova'
  const date = new Date(invoice.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const invoiceNumber = invoice.id.slice(-8).toUpperCase()

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.company}>{companyName}</Text>
          </View>
          <View>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <Text style={s.invoiceMeta}>#{invoiceNumber}</Text>
            <Text style={s.invoiceMeta}>{date}</Text>
          </View>
        </View>

        {/* Bill To / Service Address */}
        <View style={s.row}>
          <View style={[s.col, s.section]}>
            <Text style={s.sectionTitle}>Bill To</Text>
            <Text style={s.value}>{invoice.job.customer.name}</Text>
            {invoice.job.customer.address && (
              <Text style={[s.value, { marginTop: 2 }]}>{invoice.job.customer.address}</Text>
            )}
            <Text style={[s.value, { marginTop: 2, color: '#6b7280' }]}>
              {invoice.job.customer.phone}
            </Text>
            {invoice.job.customer.email && (
              <Text style={[s.value, { color: '#6b7280' }]}>{invoice.job.customer.email}</Text>
            )}
          </View>
          <View style={[s.col, s.section]}>
            <Text style={s.sectionTitle}>Service Address</Text>
            <Text style={s.value}>{invoice.job.address}</Text>
            <Text style={[s.value, { marginTop: 6, color: '#6b7280' }]}>
              {invoice.job.problemDescription}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Line Items Table */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Services &amp; Parts</Text>

          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colDesc]}>Description</Text>
            <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
            <Text style={[s.tableHeaderText, s.colUnit]}>Unit Price</Text>
            <Text style={[s.tableHeaderText, s.colTotal]}>Total</Text>
          </View>

          {invoice.lineItems.map((item) => (
            <View key={item.id} style={s.tableRow}>
              <Text style={[s.value, s.colDesc]}>{item.description}</Text>
              <Text style={[s.value, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.value, s.colUnit]}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={[s.value, s.colTotal]}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Total Due</Text>
          <Text style={s.totalsValue}>${invoice.totalAmount.toFixed(2)}</Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          Thank you for your business! Invoice #{invoiceNumber} — {companyName}
        </Text>
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────────
// Export — returns a Buffer ready to attach to an email
// ─────────────────────────────────────────────

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoicePDF invoice={invoice} />)
}
