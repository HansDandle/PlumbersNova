import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConvertLeadButton } from '@/components/leads/ConvertLeadButton'

type Params = { params: { id: string } }

export default async function LeadDetailPage({ params }: Params) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      job: { include: { technician: { select: { id: true, name: true } } } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!lead) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leads" className="text-sm text-gray-500 hover:text-gray-700">
          ← Leads
        </Link>
        <StatusBadge value={lead.status} type="lead" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium mt-0.5">
              <a href={`tel:${lead.phone}`} className="text-blue-600">{lead.phone}</a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Source</dt>
            <dd className="font-medium mt-0.5 capitalize">{lead.source.toLowerCase()}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium mt-0.5">{lead.address ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Preferred time</dt>
            <dd className="font-medium mt-0.5">{lead.preferredTime ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Problem description</dt>
            <dd className="font-medium mt-0.5">{lead.description}</dd>
          </div>
        </dl>

        {/* Convert to Job */}
        {lead.status !== 'CONVERTED' && lead.status !== 'CLOSED' && (
          <div className="pt-3 border-t border-gray-100">
            <ConvertLeadButton leadId={lead.id} defaultAddress={lead.address ?? ''} />
          </div>
        )}

        {lead.job && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Converted to job</p>
            <Link href={`/jobs/${lead.job.id}`} className="text-sm font-medium text-blue-600 hover:underline mt-0.5 block">
              View job →
            </Link>
          </div>
        )}
      </div>

      {/* Message thread */}
      {lead.messages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">SMS Conversation</h2>
          <div className="space-y-2">
            {lead.messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-xs rounded-xl px-3 py-2 text-sm ${
                  msg.direction === 'OUTBOUND'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
