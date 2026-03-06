import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JobStatusFlow } from '@/components/jobs/JobStatusFlow'
import { AssignTechnicianModal } from '@/components/jobs/AssignTechnicianModal'
import { AddPartsModal } from '@/components/jobs/AddPartsModal'
import { AddNoteModal } from '@/components/jobs/AddNoteModal'
import { AddLaborModal } from '@/components/jobs/AddLaborModal'
import { GenerateInvoiceButton } from '@/components/jobs/GenerateInvoiceButton'
import { JobTasksSection } from '@/components/jobs/JobTasksSection'
import { getSession } from '@/lib/auth'

type Params = { params: { id: string } }

export default async function JobDetailPage({ params }: Params) {
  const session = await getSession()

  const job = await prisma.job.findFirst({
    where: { id: params.id, companyId: session?.companyId },
    include: {
      customer: true,
      technician: { select: { id: true, name: true, phone: true } },
      lead: true,
      notes: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      photos: { orderBy: { createdAt: 'asc' } },
      parts: {
        include: { item: true, sourceLocation: true },
        orderBy: { createdAt: 'asc' },
      },
      laborEntries: { orderBy: { createdAt: 'asc' } },
      invoice: { include: { lineItems: true } },
    },
  })

  if (!job) notFound()

  // Fetch technicians for assignment modal (owner/dispatcher only)
  const technicians = (session?.role === 'OWNER' || session?.role === 'DISPATCHER')
    ? await prisma.user.findMany({
        where: { companyId: session.companyId, role: 'TECHNICIAN' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []

  const partsTotal = job.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0)
  const laborTotal = job.laborEntries.reduce((s, l) => s + l.amount, 0)

  const isTechnician = session?.role === 'TECHNICIAN'
  const isMyJob = job.technicianId === session?.id
  const canEdit = !isTechnician || isMyJob

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700">← Jobs</Link>
        <StatusBadge value={job.status} type="job" />
      </div>

      {/* Customer & details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <h1 className="text-xl font-bold text-gray-900">{job.customer.name}</h1>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="mt-0.5">
              <a href={`tel:${job.customer.phone}`} className="text-blue-600 font-medium">{job.customer.phone}</a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Technician</dt>
            <dd className="font-medium mt-0.5 flex items-center gap-2">
              <span>{job.technician?.name ?? 'Unassigned'}</span>
              {technicians.length > 0 && !['INVOICED', 'PAID'].includes(job.status) && (
                <AssignTechnicianModal
                  jobId={job.id}
                  technicians={technicians}
                  currentTechnicianId={job.technicianId}
                  currentScheduledTime={job.scheduledTime}
                  reassign
                />
              )}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium mt-0.5">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {job.address}
              </a>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Problem</dt>
            <dd className="font-medium mt-0.5">{job.problemDescription}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Scheduled</dt>
            <dd className="font-medium mt-0.5 flex items-center gap-2">
              <span>
                {job.scheduledTime
                  ? new Date(job.scheduledTime).toLocaleString()
                  : <span className="text-gray-400 font-normal">Not scheduled</span>}
                {job.scheduledEndTime && ` – ${new Date(job.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
              {technicians.length > 0 && !['INVOICED', 'PAID'].includes(job.status) && (
                <AssignTechnicianModal
                  jobId={job.id}
                  technicians={technicians}
                  currentTechnicianId={job.technicianId}
                  currentScheduledTime={job.scheduledTime}
                  reassign
                  triggerLabel="Edit time"
                />
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Status flow / assign technician */}
      {canEdit && (
        <div className="space-y-2">
          {job.status === 'SCHEDULED' || (job.status === 'JOB_REQUESTED' && !job.technicianId)
            ? <AssignTechnicianModal
                jobId={job.id}
                technicians={technicians}
                currentTechnicianId={job.technicianId}
                currentScheduledTime={job.scheduledTime}
              />
            : <JobStatusFlow jobId={job.id} currentStatus={job.status} />
          }
        </div>
      )}

      {/* Tasks / Flat Rate Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <JobTasksSection
          jobId={job.id}
          readOnly={['INVOICED', 'PAID'].includes(job.status)}
        />
      </div>

      {/* Parts */}
      <Section title="Parts Used" action={canEdit && job.status !== 'PAID' ? <AddPartsModal jobId={job.id} /> : undefined}>
        {job.parts.length === 0 ? (
          <p className="text-sm text-gray-400">No parts added yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2">Item</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Unit</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {job.parts.map((p) => (
                <tr key={p.id}>
                  <td className="py-1.5">
                    <p className="font-medium">{p.item.name}</p>
                    {p.sourceLocation && (
                      <p className="text-xs text-gray-400">{p.sourceLocation.name}</p>
                    )}
                  </td>
                  <td className="text-right py-1.5">{p.quantity}</td>
                  <td className="text-right py-1.5">${p.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-1.5 font-medium">${(p.quantity * p.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="pt-2 text-sm text-gray-500">Parts subtotal</td>
                <td className="text-right pt-2 font-semibold">${partsTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Section>

      {/* Labor */}
      <Section title="Labor" action={canEdit && job.status !== 'PAID' ? <AddLaborModal jobId={job.id} /> : undefined}>
        {job.laborEntries.length === 0 ? (
          <p className="text-sm text-gray-400">No labor entries added yet</p>
        ) : (
          <ul className="space-y-2">
            {job.laborEntries.map((l) => (
              <li key={l.id} className="flex justify-between text-sm">
                <span>{l.description}</span>
                <span className="font-medium">${l.amount.toFixed(2)}</span>
              </li>
            ))}
            <li className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
              <span className="text-gray-500">Labor subtotal</span>
              <span>${laborTotal.toFixed(2)}</span>
            </li>
          </ul>
        )}
      </Section>

      {/* Notes */}
      <Section title="Notes" action={canEdit ? <AddNoteModal jobId={job.id} /> : undefined}>
        {job.notes.length === 0 ? (
          <p className="text-sm text-gray-400">No notes yet</p>
        ) : (
          <ul className="space-y-2">
            {job.notes.map((n) => (
              <li key={n.id} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.author.name} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Photos */}
      {job.photos.length > 0 && (
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-2">
            {job.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.url} alt={p.caption ?? 'job photo'} className="rounded-lg object-cover aspect-square" />
            ))}
          </div>
        </Section>
      )}

      {/* Invoice */}
      {job.invoice ? (
        <Section title="Invoice">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold">${job.invoice.total.toFixed(2)}</span>
            </div>
            <StatusBadge value={job.invoice.status} type="invoice" />
            <Link href={`/invoices/${job.invoice.id}`} className="text-sm text-blue-600 hover:underline block mt-1">
              View full invoice →
            </Link>
          </div>
        </Section>
      ) : (
        job.status === 'COMPLETED' && canEdit && (
          <Section title="Invoice">
            <GenrateInvoiceSection jobId={job.id} />
          </Section>
        )
      )}
    </div>
  )
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function GenrateInvoiceSection({ jobId }: { jobId: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">No invoice yet. Generate one from parts and labor above.</p>
      <GenerateInvoiceButton jobId={jobId} />
    </div>
  )
}
