'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markPaid() {
    if (!confirm('Mark this invoice as paid?')) return
    setLoading(true)
    try {
      await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={markPaid}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Updating…' : 'Mark as Paid'}
    </button>
  )
}
