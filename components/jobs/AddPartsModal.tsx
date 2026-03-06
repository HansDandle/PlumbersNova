'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type InventoryItem = {
  id: string
  sku: string
  name: string
  defaultPrice: number | null
  cost: number
}

type InventoryLocation = {
  id: string
  name: string
  type: string
}

export function AddPartsModal({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    itemId: '',
    quantity: 1,
    unitPrice: 0,
    sourceLocationId: '',
  })

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/inventory/items?pageSize=200').then((r) => r.json()),
        fetch('/api/inventory/locations').then((r) => r.json()),
      ]).then(([itemsRes, locsRes]) => {
        setItems(itemsRes.data ?? [])
        setLocations(locsRes.data ?? [])
      })
    }
  }, [open])

  function handleItemChange(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    setForm((f) => ({
      ...f,
      itemId,
      unitPrice: item?.defaultPrice ?? item?.cost ?? 0,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch(`/api/jobs/${jobId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sourceLocationId: form.sourceLocationId || undefined,
        }),
      })
      setOpen(false)
      setForm({ itemId: '', quantity: 1, unitPrice: 0, sourceLocationId: '' })
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
        + Add Part
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Add Part</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                <select
                  required
                  value={form.itemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a part…</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
                <select
                  value={form.sourceLocationId}
                  onChange={(e) => setForm((f) => ({ ...f, sourceLocationId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Supply house / cash purchase</option>
                  {locations
                    .filter((l) => l.type !== 'SUPPLY_HOUSE')
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </select>
              </div>

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
                  {loading ? 'Adding…' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
