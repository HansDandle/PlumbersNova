'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ConvertLeadButton({
  leadId,
  defaultAddress,
}: {
  leadId: string
  defaultAddress: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState(defaultAddress)
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          scheduledTime: scheduledTime || undefined,
        }),
      })

      if (res.ok) {
        const { data } = await res.json()
        router.push(`/jobs/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Convert to Job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Convert Lead to Job</h3>

            <form onSubmit={handleConvert} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {loading ? 'Creating…' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
