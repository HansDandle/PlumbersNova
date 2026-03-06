import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// ─── Period helpers ────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
]

function getPeriodStart(period: string): Date | null {
  const now = new Date()
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === '3months') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 3)
    return d
  }
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  return null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<string, string> = {
  JOB_REQUESTED: 'Requested',
  SCHEDULED: 'Scheduled',
  TECHNICIAN_ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
}

const STATUS_COLORS: Record<string, string> = {
  JOB_REQUESTED: 'bg-gray-200',
  SCHEDULED: 'bg-yellow-200',
  TECHNICIAN_ASSIGNED: 'bg-blue-200',
  EN_ROUTE: 'bg-indigo-200',
  IN_PROGRESS: 'bg-purple-200',
  COMPLETED: 'bg-green-200',
  INVOICED: 'bg-teal-200',
  PAID: 'bg-emerald-300',
}

// ─── Monthly revenue helper ────────────────────────────────────────────────

function computeMonthlyRevenue(
  invoices: { total: number; status: string; createdAt: Date }[]
) {
  const map = new Map<string, { invoiced: number; collected: number }>()
  for (let i = 5; i >= 0; i--) {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, { invoiced: 0, collected: 0 })
  }
  for (const inv of invoices) {
    const d = new Date(inv.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (map.has(key)) {
      const entry = map.get(key)!
      entry.invoiced += inv.total
      if (inv.status === 'PAID') entry.collected += inv.total
    }
  }
  return Array.from(map.entries()).map(([month, data]) => ({ month, ...data }))
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.companyId) redirect('/api/auth/logout-redirect')

  const { companyId, role } = session
  const period = searchParams.period ?? 'month'
  const periodStart = getPeriodStart(period)
  const dateFilter = periodStart ? { gte: periodStart } : undefined
  const isTech = role === 'TECHNICIAN'

  // ── Queries ──────────────────────────────────────────────────────────────

  const [jobs, invoices] = await Promise.all([
    prisma.job.findMany({
      where: {
        companyId,
        ...(isTech ? { technicianId: session.id } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        status: true,
        technicianId: true,
        technician: { select: { id: true, name: true } },
        createdAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        companyId,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(isTech ? { job: { technicianId: session.id } } : {}),
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        job: { select: { technicianId: true } },
      },
    }),
  ])

  const leads = !isTech
    ? await prisma.lead.findMany({
        where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, status: true },
      })
    : ([] as { id: string; status: string }[])

  const technicians = !isTech
    ? await prisma.user.findMany({
        where: { companyId, role: 'TECHNICIAN' },
        select: { id: true, name: true },
      })
    : ([] as { id: string; name: string }[])

  // ── Compute company-level stats ───────────────────────────────────────────

  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length
  const paidInvoicedCount = jobs.filter((j) =>
    ['INVOICED', 'PAID'].includes(j.status)
  ).length
  const openCount = jobs.filter(
    (j) => !['COMPLETED', 'INVOICED', 'PAID'].includes(j.status)
  ).length

  const totalCollected = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.total, 0)
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((s, i) => s + i.total, 0)

  const doneJobs = completedCount + paidInvoicedCount
  const avgJobValue = doneJobs > 0 ? Math.round(totalInvoiced / doneJobs) : 0

  // Lead funnel
  const totalLeads = leads.length
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length
  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  // Per-technician breakdown
  const techStats = technicians
    .map((tech) => {
      const tJobs = jobs.filter((j) => j.technicianId === tech.id)
      const tCompleted = tJobs.filter((j) =>
        ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status)
      ).length
      const tOpen = tJobs.filter(
        (j) => !['COMPLETED', 'INVOICED', 'PAID'].includes(j.status)
      ).length
      const tInvoices = invoices.filter((i) => i.job.technicianId === tech.id)
      const tCollected = tInvoices
        .filter((i) => i.status === 'PAID')
        .reduce((s, i) => s + i.total, 0)
      const tInvoiced = tInvoices.reduce((s, i) => s + i.total, 0)
      const tAvg = tCompleted > 0 ? Math.round(tInvoiced / tCompleted) : 0
      return {
        ...tech,
        totalJobs: tJobs.length,
        completedJobs: tCompleted,
        openJobs: tOpen,
        collected: tCollected,
        invoiced: tInvoiced,
        avgJob: tAvg,
      }
    })
    .sort((a, b) => b.collected - a.collected)

  // Monthly revenue (last 6 months, owner only)
  const monthly = !isTech ? computeMonthlyRevenue(invoices) : []
  const maxMonthlyInvoiced = Math.max(...monthly.map((m) => m.invoiced), 1)

  // Job status breakdown
  const statusOrder = [
    'JOB_REQUESTED',
    'SCHEDULED',
    'TECHNICIAN_ASSIGNED',
    'EN_ROUTE',
    'IN_PROGRESS',
    'COMPLETED',
    'INVOICED',
    'PAID',
  ]
  const statusCounts: Record<string, number> = {}
  for (const j of jobs) {
    statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1
  }
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header + period picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTech ? 'Your performance summary' : 'Company-wide performance'}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/reports?period=${p.value}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Overview cards ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {isTech ? 'Your Overview' : 'Company Overview'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Collected"
            value={fmt(totalCollected)}
            sub={`${fmt(totalInvoiced)} invoiced`}
            color="text-emerald-600"
          />
          <StatCard
            label={isTech ? 'My Jobs' : 'Total Jobs'}
            value={String(jobs.length)}
            sub={`${openCount} open · ${doneJobs} done`}
          />
          <StatCard
            label="Avg Job Value"
            value={fmt(avgJobValue)}
            sub={`based on ${doneJobs} closed`}
          />
          {!isTech ? (
            <StatCard
              label="Outstanding"
              value={fmt(totalOutstanding)}
              sub={`${invoices.filter((i) => i.status !== 'PAID').length} unpaid invoices`}
              color="text-amber-600"
            />
          ) : (
            <StatCard
              label="Open Jobs"
              value={String(openCount)}
              sub="not yet completed"
              color="text-blue-600"
            />
          )}
        </div>
      </section>

      {/* ── Lead Funnel (owner only) ─────────────────────────────────────── */}
      {!isTech && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Lead Funnel
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row gap-6 items-center">
            <FunnelStep label="New Leads" count={totalLeads} color="bg-blue-500" />
            <div className="text-gray-300 text-2xl hidden sm:block">→</div>
            <FunnelStep
              label="Converted"
              count={convertedLeads}
              color="bg-green-500"
            />
            <div className="sm:ml-auto text-center">
              <div className="text-3xl font-bold text-gray-900">
                {conversionRate}%
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Conversion Rate</div>
            </div>
          </div>
        </section>
      )}

      {/* ── Technician Breakdown (owner only) ───────────────────────────── */}
      {!isTech && technicians.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Technician Breakdown
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Technician
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">
                    Total Jobs
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">
                    Completed
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">
                    Open
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">
                    Collected
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">
                    Invoiced
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">
                    Avg Job
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {techStats.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
                      {t.totalJobs}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {t.completedJobs}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
                      {t.openJobs}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">
                      {fmt(t.collected)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">
                      {fmt(t.invoiced)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
                      {fmt(t.avgJob)}
                    </td>
                  </tr>
                ))}
                {techStats.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No technician data for this period
                    </td>
                  </tr>
                )}
              </tbody>
              {techStats.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700 hidden sm:table-cell">
                      {techStats.reduce((s, t) => s + t.totalJobs, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      {techStats.reduce((s, t) => s + t.completedJobs, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700 hidden sm:table-cell">
                      {techStats.reduce((s, t) => s + t.openJobs, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {fmt(techStats.reduce((s, t) => s + t.collected, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700 hidden sm:table-cell">
                      {fmt(techStats.reduce((s, t) => s + t.invoiced, 0))}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}

      {/* ── Monthly Revenue (owner only, always last 6 months) ───────────── */}
      {!isTech && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Revenue — Last 6 Months
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            {monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-500 shrink-0">
                  {fmtMonth(m.month)}
                </div>
                <div className="flex-1 space-y-1">
                  {/* Invoiced bar */}
                  <div className="h-3 rounded bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded bg-blue-200 transition-all"
                      style={{
                        width: `${Math.round((m.invoiced / maxMonthlyInvoiced) * 100)}%`,
                      }}
                    />
                  </div>
                  {/* Collected bar */}
                  <div className="h-3 rounded bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded bg-emerald-400 transition-all"
                      style={{
                        width: `${Math.round((m.collected / maxMonthlyInvoiced) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 w-24">
                  <div className="text-xs font-medium text-emerald-700">
                    {fmt(m.collected)}
                  </div>
                  <div className="text-xs text-gray-400">{fmt(m.invoiced)} inv.</div>
                </div>
              </div>
            ))}
            <div className="flex gap-4 pt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-emerald-400" />
                Collected
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-blue-200" />
                Invoiced
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Job Status Breakdown ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Jobs by Status
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2.5">
          {statusOrder
            .filter((s) => statusCounts[s] > 0)
            .map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-36 text-sm text-gray-600 shrink-0">
                  {STATUS_LABELS[s]}
                </div>
                <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded ${STATUS_COLORS[s]} transition-all`}
                    style={{
                      width: `${Math.round((statusCounts[s] / maxStatusCount) * 100)}%`,
                    }}
                  />
                </div>
                <div className="w-8 text-right text-sm font-medium text-gray-700 shrink-0">
                  {statusCounts[s]}
                </div>
              </div>
            ))}
          {jobs.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              No jobs found for this period
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Small components ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = 'text-gray-900',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

function FunnelStep({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div>
        <div className="text-2xl font-bold text-gray-900">{count}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}
