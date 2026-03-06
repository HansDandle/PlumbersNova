import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MarkInvoicePaidButton } from '@/components/invoices/MarkInvoicePaidButton'
import { SendInvoiceButton } from '@/components/invoices/SendInvoiceButton'

type Params = { params: { id: string } }

export default async function InvoiceDetailPage({ params }: Params) {
  const session = await getSession()
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, companyId: session?.companyId },
    include: {
      lineItems: true,
      job: { include: { customer: true, technician: { select: { id: true, name: true } } } },
    },
  })

  if (!invoice) notFound()

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-700">← Invoices</Link>
        <StatusBadge value={invoice.status} type="invoice" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{invoice.job.customer.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{invoice.job.address}</p>
            {invoice.job.technician && (
              <p className="text-sm text-gray-500 mt-0.5">Tech: {invoice.job.technician.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Invoice #{invoice.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-left text-gray-500 border-b border-gray-200">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.lineItems.map((li) => (
              <tr key={li.id}>
                <td className="py-2">
                  <p>{li.description}</p>
                  <p className="text-xs text-gray-400 capitalize">{li.type.replace('_', ' ').toLowerCase()}</p>
                </td>
                <td className="text-right py-2">{li.quantity}</td>
                <td className="text-right py-2">${li.unitPrice.toFixed(2)}</td>
                <td className="text-right py-2 font-medium">${li.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="pt-3 font-semibold text-gray-900">Total</td>
              <td className="text-right pt-3 text-lg font-bold">${invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {invoice.status === 'UNSENT' && <SendInvoiceButton invoiceId={invoice.id} />}
          {invoice.status === 'SENT' && <MarkInvoicePaidButton invoiceId={invoice.id} />}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <Link href={`/jobs/${invoice.jobId}`} className="text-sm text-blue-600 hover:underline">
            ← Back to job
          </Link>
        </div>
      </div>
    </div>
  )
}
