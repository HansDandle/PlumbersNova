'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
    preferredTime: '',
    source: 'MANUAL' as 'PHONE' | 'SMS' | 'MANUAL',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const { data } = await res.json()
        router.push(`/leads/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/leads" className="text-sm text-gray-500 hover:text-gray-700">← Leads</Link>
        <h1 className="text-xl font-bold text-gray-900">New Lead</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description *</label>
          <textarea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the plumbing issue…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
            <input type="text" value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)}
              placeholder="e.g. Tuesday afternoon"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select value={form.source} onChange={(e) => set('source', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MANUAL">Manual entry</option>
              <option value="PHONE">Phone call</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/leads"
            className="flex-1 py-2 text-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
