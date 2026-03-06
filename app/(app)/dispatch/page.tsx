import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { DispatchBoard } from '@/components/dispatch/DispatchBoard'

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await getSession()
  const dateStr = searchParams.date ?? new Date().toISOString().split('T')[0]
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)

  const [technicians, scheduledJobs, unscheduledJobs] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'TECHNICIAN', companyId: session?.companyId },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.job.findMany({
      where: {
        companyId: session?.companyId,
        scheduledTime: { gte: date, lt: nextDay },
        status: { notIn: ['COMPLETED', 'INVOICED', 'PAID'] },
      },
      include: {
        customer: true,
        technician: { select: { id: true, name: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    }),
    prisma.job.findMany({
      where: {
        companyId: session?.companyId,
        OR: [{ scheduledTime: null }, { technicianId: null }],
        status: { in: ['JOB_REQUESTED', 'SCHEDULED'] },
      },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    }),
  ])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Dispatch Board</h1>
      <DispatchBoard
        date={dateStr}
        technicians={technicians}
        scheduledJobs={scheduledJobs as any}
        unscheduledJobs={unscheduledJobs as any}
      />
    </div>
  )
}
