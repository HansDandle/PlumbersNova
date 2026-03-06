'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GenerateInvoiceButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serviceCall, setServiceCall] = useState('125')

  async function handleGenerate() {
    setLoading(true)
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          serviceCallAmount: parseFloat(serviceCall) || 0,
        }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <label className="text-sm text-gray-600">Service call $</label>
        <input
          type="number"
          value={serviceCall}
          onChange={(e) => setServiceCall(e.target.value)}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Generating…' : 'Generate Invoice'}
      </button>
    </div>
  )
}
