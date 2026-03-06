import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()

  const cid = session?.companyId

  const [openJobs, newLeads, unpaidInvoices] = await Promise.all([
    prisma.job.count({
      where: { companyId: cid, status: { in: ['JOB_REQUESTED', 'SCHEDULED', 'TECHNICIAN_ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'] } },
    }),
    prisma.lead.count({ where: { companyId: cid, status: 'NEW' } }),
    prisma.invoice.count({ where: { companyId: cid, status: { in: ['UNSENT', 'SENT'] } } }),
  ])

  // Today's jobs for the calendar summary
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const todaysJobs = await prisma.job.findMany({
    where: {
      companyId: cid,
      scheduledTime: { gte: today, lt: tomorrow },
    },
    include: {
      customer: true,
      technician: { select: { id: true, name: true } },
    },
    orderBy: { scheduledTime: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {session?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open Jobs" value={openJobs} href="/jobs" color="blue" />
        <StatCard label="New Leads" value={newLeads} href="/leads" color="amber" />
        <StatCard label="Unpaid Invoices" value={unpaidInvoices} href="/invoices" color="red" />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
          <Link href="/dispatch" className="text-sm text-blue-600 hover:underline">
            View dispatch board →
          </Link>
        </div>

        {todaysJobs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No jobs scheduled today</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {todaysJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.customer.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{job.address}</p>
                    {job.technician && (
                      <p className="text-xs text-blue-600 mt-0.5">→ {job.technician.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {job.scheduledTime
                        ? new Date(job.scheduledTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                    <JobStatusPill status={job.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string
  value: number
  href: string
  color: 'blue' | 'amber' | 'red'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${colors[color]}`}>{value}</div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
    </Link>
  )
}

function JobStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    JOB_REQUESTED: 'bg-gray-100 text-gray-600',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    TECHNICIAN_ASSIGNED: 'bg-indigo-100 text-indigo-700',
    EN_ROUTE: 'bg-violet-100 text-violet-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    INVOICED: 'bg-teal-100 text-teal-700',
    PAID: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
