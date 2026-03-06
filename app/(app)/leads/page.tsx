import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 25

  const where = searchParams.status ? { status: searchParams.status as any } : {}

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ])

  const statuses = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Link
          href="/leads/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Lead
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/leads"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.status === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Leads list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {leads.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No leads found</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{lead.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge value={lead.status} type="lead" />
                    <span className="text-xs text-gray-400 capitalize">{lead.source.toLowerCase()}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/leads?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page < Math.ceil(total / pageSize) && (
            <Link href={`/leads?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
