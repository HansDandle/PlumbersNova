import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 25
  const where = searchParams.status ? { status: searchParams.status as any } : {}

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { job: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'UNSENT', 'SENT', 'PAID'].map((s) => (
          <Link
            key={s}
            href={s ? `/invoices?status=${s}` : '/invoices'}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (searchParams.status ?? '') === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No invoices</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-left text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/invoices/${inv.id}`} className="hover:text-blue-600">
                      {inv.job.customer.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{inv.job.address}</td>
                  <td className="px-5 py-3">
                    <StatusBadge value={inv.status} type="invoice" />
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">${inv.total.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/invoices?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / pageSize)}</span>
          {page < Math.ceil(total / pageSize) && (
            <Link href={`/invoices?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
