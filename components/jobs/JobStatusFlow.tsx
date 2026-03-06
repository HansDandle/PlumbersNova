'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type JobStatus =
  | 'JOB_REQUESTED'
  | 'SCHEDULED'
  | 'TECHNICIAN_ASSIGNED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVOICED'
  | 'PAID'

const FLOW: JobStatus[] = [
  'JOB_REQUESTED',
  'SCHEDULED',
  'TECHNICIAN_ASSIGNED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'COMPLETED',
  'INVOICED',
  'PAID',
]

const NEXT_LABEL: Partial<Record<JobStatus, string>> = {
  JOB_REQUESTED:      'Schedule Job',
  SCHEDULED:          'Assign Technician',
  TECHNICIAN_ASSIGNED:'Mark En Route',
  EN_ROUTE:           'Start Job',
  IN_PROGRESS:        'Mark Complete',
  COMPLETED:          'Generate Invoice',
  INVOICED:           'Mark Paid',
}

const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  JOB_REQUESTED:      'SCHEDULED',
  SCHEDULED:          'TECHNICIAN_ASSIGNED',
  TECHNICIAN_ASSIGNED:'EN_ROUTE',
  EN_ROUTE:           'IN_PROGRESS',
  IN_PROGRESS:        'COMPLETED',
  // COMPLETED → INVOICED handled by invoice creation, not status flow
  INVOICED:           'PAID',
}

export function JobStatusFlow({
  jobId,
  currentStatus,
}: {
  jobId: string
  currentStatus: JobStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const nextStatus = NEXT_STATUS[currentStatus]
  const nextLabel = NEXT_LABEL[currentStatus]

  if (!nextStatus || !nextLabel) return null
  // Completed → Invoiced is handled by the invoice generation button
  if (currentStatus === 'COMPLETED') return null

  async function advance() {
    setLoading(true)
    try {
      await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const isMainAction = ['EN_ROUTE', 'IN_PROGRESS'].includes(currentStatus)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <button
        onClick={advance}
        disabled={loading}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
          isMainAction
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {loading ? 'Updating…' : nextLabel}
      </button>
    </div>
  )
}
