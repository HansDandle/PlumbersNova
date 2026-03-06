'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markSent() {
    setLoading(true)
    try {
      await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      // TODO: trigger email/SMS delivery of invoice PDF
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={markSent}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Sending…' : 'Send Invoice'}
    </button>
  )
}
