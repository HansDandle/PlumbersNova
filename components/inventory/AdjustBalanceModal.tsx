'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  sku: string
  category: string | null
}

interface Props {
  locationId: string
  locationName: string
}

export default function AdjustBalanceModal({ locationId, locationName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    fetch('/api/inventory/items')
      .then((r) => r.json())
      .then((data) => setItems(data.data ?? []))
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemId || quantity === 0) {
      setError('Select an item and enter a non-zero quantity.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch(`/api/inventory/locations/${locationId}/balances`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Failed to adjust balance.')
      return
    }
    setOpen(false)
    setItemId('')
    setQuantity(0)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Adjust Stock
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Adjust Stock</h2>
              <p className="text-sm text-gray-500 mt-0.5">{locationName}</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an item…</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}){item.category ? ` — ${item.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity change
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Positive to add stock, negative to remove (e.g. +10 or -3)
                </p>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
