'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddLaborModal({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch(`/api/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `[LABOR] ${description}: $${amount}` }),
      })

      // Also post to a /api/jobs/:id/labor endpoint (add as needed)
      // For now we POST to a conventional endpoint
      await fetch(`/api/jobs/${jobId}/labor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount: parseFloat(amount) }),
      })

      setDescription('')
      setAmount('')
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 font-medium hover:underline"
      >
        + Add Labor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Add Labor</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  required
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 hours diagnostic"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="150.00"
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
                  {loading ? 'Saving…' : 'Add Labor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
