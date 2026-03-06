'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddNoteModal({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    try {
      await fetch(`/api/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setContent('')
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
        + Add Note
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Add Note</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
