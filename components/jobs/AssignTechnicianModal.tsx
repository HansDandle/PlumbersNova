'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Technician = { id: string; name: string }

export function AssignTechnicianModal({
  jobId,
  technicians,
  currentTechnicianId,
  currentScheduledTime,
  reassign = false,
}: {
  jobId: string
  technicians: Technician[]
  currentTechnicianId: string | null
  currentScheduledTime: Date | null
  reassign?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [technicianId, setTechnicianId] = useState(currentTechnicianId ?? '')
  const [scheduledTime, setScheduledTime] = useState(
    currentScheduledTime
      ? new Date(currentScheduledTime).toISOString().slice(0, 16)
      : ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!technicianId) { setError('Please select a technician'); return }
    setLoading(true)
    setError('')
    try {
      // Update technicianId + scheduledTime
      const patchRes = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          ...(scheduledTime ? { scheduledTime } : {}),
        }),
      })
      if (!patchRes.ok) throw new Error('Failed to update job')

      // Only advance status when doing initial assignment, not reassignment
      if (!reassign) {
        const statusRes = await fetch(`/api/jobs/${jobId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'TECHNICIAN_ASSIGNED' }),
        })
        if (!statusRes.ok) throw new Error('Failed to update status')
      }

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={reassign
          ? 'text-xs text-blue-600 hover:underline font-medium'
          : 'w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
        }
      >
        {reassign ? 'Reassign' : 'Assign Technician'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {reassign ? 'Reassign Technician' : 'Assign Technician'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician *</label>
                <select
                  required
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select technician —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled time <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Saving…' : reassign ? 'Reassign' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
