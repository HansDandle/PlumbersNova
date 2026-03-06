import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getSession } from '@/lib/auth'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const session = await getSession()
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 25

  const where: any = {
    ...(searchParams.status ? { status: searchParams.status } : {}),
    // Technicians only see their own jobs
    ...(session?.role === 'TECHNICIAN' ? { technicianId: session.id } : {}),
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        customer: true,
        technician: { select: { id: true, name: true } },
        invoice: { select: { status: true, total: true } },
      },
      orderBy: { scheduledTime: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ])

  const activeStatuses = ['JOB_REQUESTED', 'SCHEDULED', 'TECHNICIAN_ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS']
  const allStatuses = [...activeStatuses, 'COMPLETED', 'INVOICED', 'PAID']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/jobs"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {allStatuses.map((s) => (
          <Link
            key={s}
            href={`/jobs?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.status === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Jobs list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {jobs.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No jobs found</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{job.customer.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{job.problemDescription}</p>
                    {job.technician && (
                      <p className="text-xs text-blue-600 mt-0.5">→ {job.technician.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                    <StatusBadge value={job.status} type="job" />
                    {job.scheduledTime && (
                      <span className="text-xs text-gray-400">
                        {new Date(job.scheduledTime).toLocaleDateString()}
                      </span>
                    )}
                    {job.invoice && (
                      <span className="text-xs font-medium text-gray-700">
                        ${job.invoice.total.toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/jobs?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page < Math.ceil(total / pageSize) && (
            <Link href={`/jobs?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
