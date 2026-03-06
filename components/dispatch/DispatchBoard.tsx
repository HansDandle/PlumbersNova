'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Technician = { id: string; name: string; phone?: string | null }
type JobSummary = {
  id: string
  status: string
  address: string
  scheduledTime: string | null
  problemDescription: string
  technicianId: string | null
  customer: { name: string; phone: string }
  technician: { id: string; name: string } | null
}

export function DispatchBoard({
  date,
  technicians,
  scheduledJobs,
  unscheduledJobs,
}: {
  date: string
  technicians: Technician[]
  scheduledJobs: JobSummary[]
  unscheduledJobs: JobSummary[]
}) {
  const router = useRouter()
  const [draggingJob, setDraggingJob] = useState<string | null>(null)

  async function assignTechnician(jobId: string, technicianId: string) {
    // Set the scheduled time to noon on the currently-viewed date so the job
    // appears in the scheduled lane immediately after dropping
    const scheduledTime = new Date(`${date}T12:00:00`).toISOString()
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, scheduledTime }),
    })
    await fetch(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'TECHNICIAN_ASSIGNED' }),
    })
    router.refresh()
  }

  function handleDragStart(jobId: string) {
    setDraggingJob(jobId)
  }

  function handleDropOnTech(technicianId: string) {
    if (!draggingJob) return
    assignTechnician(draggingJob, technicianId)
    setDraggingJob(null)
  }

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-5">
      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dispatch?date=${prevDay(date)}`}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          ← Prev
        </Link>
        <span className="font-medium text-gray-800 text-sm">{dateLabel}</span>
        <Link
          href={`/dispatch?date=${nextDay(date)}`}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Next →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Unscheduled queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-700">
              Unscheduled Queue <span className="text-gray-400">({unscheduledJobs.length})</span>
            </h2>
          </div>
          <ul className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
            {unscheduledJobs.length === 0 ? (
              <li className="py-8 text-center text-sm text-gray-400">All caught up!</li>
            ) : (
              unscheduledJobs.map((job) => (
                <li
                  key={job.id}
                  draggable
                  onDragStart={() => handleDragStart(job.id)}
                  className="px-4 py-3 cursor-grab hover:bg-gray-50 transition-colors"
                >
                  <Link href={`/jobs/${job.id}`} className="block">
                    <p className="text-sm font-medium text-gray-900">{job.customer.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{job.problemDescription}</p>
                    {job.technician && (
                      <p className="text-xs text-blue-500 mt-0.5">→ {job.technician.name} (no time set)</p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Technician columns */}
        <div className="lg:col-span-2 space-y-4">
          {technicians.map((tech) => {
            const techJobs = scheduledJobs.filter((j) => j.technicianId === tech.id)
            return (
              <div
                key={tech.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnTech(tech.id)}
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-800">{tech.name}</h3>
                  <span className="text-xs text-gray-400">{techJobs.length} job{techJobs.length !== 1 ? 's' : ''}</span>
                </div>

                {techJobs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 m-3 rounded-lg">
                    Drop a job here to assign
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {techJobs.map((job) => (
                      <li key={job.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <Link href={`/jobs/${job.id}`} className="block">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{job.customer.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{job.address}</p>
                            </div>
                            {job.scheduledTime && (
                              <span className="text-xs text-gray-400 shrink-0 ml-2">
                                {new Date(job.scheduledTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function prevDay(date: string) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    SCHEDULED:          'bg-blue-100 text-blue-700',
    TECHNICIAN_ASSIGNED:'bg-indigo-100 text-indigo-700',
    EN_ROUTE:           'bg-violet-100 text-violet-700',
    IN_PROGRESS:        'bg-amber-100 text-amber-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
