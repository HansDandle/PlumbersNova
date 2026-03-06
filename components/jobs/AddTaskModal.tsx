'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceBookTask = {
  id: string
  category: string
  name: string
  description?: string | null
  unitPrice: number
}

type TaskMaterial = {
  id: string
  defaultQuantity: number
  item: {
    id: string
    name: string
    sku: string
    cost: number
    defaultPrice?: number | null
    category?: string | null
  }
}

type TruckLocation = {
  id: string
  name: string
  type: string
  technician?: { id: string; name: string } | null
  balances: { itemId: string; quantity: number }[]
}

type MaterialDecision =
  | { type: 'truck'; locationId: string; unitPrice: number }
  | { type: 'purchased'; unitPrice: number }
  | { type: 'skip' }

type Props = {
  jobId: string
  onTaskAdded: () => void
}

const CATEGORY_ICONS: Record<string, string> = {
  'All': '🔍',
  'Fees': '💲',
  'Drain Cleaning': '🚿',
  'Kitchen Sinks': '🍽️',
  'Toilets & Urinals': '🚽',
  'Bathroom Sinks & Faucets': '🪠',
  'Tubs & Showers': '🛁',
  'Pumps': '⚙️',
  'Water Heaters': '🔥',
  'Laundry & Utility': '🧺',
  'Custom': '✏️',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

export function AddTaskModal({ jobId, onTaskAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<PriceBookTask[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCat, setSelectedCat] = useState('All')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null) // id of task being added

  // Custom entry state
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customQty, setCustomQty] = useState('1')
  const [customSaving, setCustomSaving] = useState(false)

  // Step 2 — materials
  const [materialsStep, setMaterialsStep] = useState(false)
  const [pendingMaterials, setPendingMaterials] = useState<TaskMaterial[]>([])
  const [decisions, setDecisions] = useState<Record<string, MaterialDecision>>({})
  const [truckLocations, setTruckLocations] = useState<TruckLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [confirmingMaterials, setConfirmingMaterials] = useState(false)

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams({ activeOnly: 'true' })
    if (search) params.set('search', search)
    if (selectedCat !== 'All' && selectedCat !== 'Custom') params.set('category', selectedCat)
    const res = await fetch(`/api/pricebook?${params}`)
    const data: PriceBookTask[] = await res.json()
    setTasks(data)
    const cats = ['All', ...Array.from(new Set(data.map((t) => t.category))).sort(), 'Custom']
    setCategories(cats)
  }, [search, selectedCat])

  useEffect(() => {
    if (open && !materialsStep) loadTasks()
  }, [open, materialsStep, loadTasks])

  // ── Adding a price book task ───────────────────────────────────────────────

  async function addTask(task: PriceBookTask) {
    setAdding(task.id)
    const res = await fetch(`/api/jobs/${jobId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceBookTaskId: task.id,
        name: task.name,
        description: task.description,
        quantity: 1,
        unitPrice: task.unitPrice,
      }),
    })
    const data = await res.json()
    setAdding(null)

    const materials: TaskMaterial[] = data.materials ?? []

    if (materials.length > 0) {
      const initial: Record<string, MaterialDecision> = {}
      materials.forEach((m) => {
        initial[m.id] = { type: 'purchased', unitPrice: m.item.cost }
      })
      setDecisions(initial)
      setPendingMaterials(materials)
      setMaterialsStep(true)

      const itemIds = materials.map((m) => m.item.id).join(',')
      setLoadingLocations(true)
      fetch(`/api/me/truck-locations?itemIds=${itemIds}`)
        .then((r) => r.json())
        .then((locs: TruckLocation[]) => {
          setTruckLocations(locs)
          setDecisions((prev) => {
            const updated = { ...prev }
            materials.forEach((m) => {
              const truckWithStock = locs.find(
                (l) =>
                  l.type === 'TRUCK' &&
                  (l.balances.find((b) => b.itemId === m.item.id)?.quantity ?? 0) > 0
              )
              if (truckWithStock) {
                updated[m.id] = {
                  type: 'truck',
                  locationId: truckWithStock.id,
                  unitPrice: m.item.defaultPrice ?? m.item.cost,
                }
              }
            })
            return updated
          })
        })
        .finally(() => setLoadingLocations(false))
    } else {
      onTaskAdded()
    }
  }

  // ── Confirm materials ──────────────────────────────────────────────────────

  async function confirmMaterials() {
    setConfirmingMaterials(true)
    const parts = pendingMaterials
      .map((m) => {
        const d = decisions[m.id]
        if (!d || d.type === 'skip') return null
        return {
          itemId: m.item.id,
          quantity: m.defaultQuantity,
          unitPrice: d.unitPrice,
          sourceLocationId: d.type === 'truck' ? d.locationId : null,
        }
      })
      .filter(Boolean)

    if (parts.length > 0) {
      await fetch(`/api/jobs/${jobId}/parts-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts }),
      })
    }
    setConfirmingMaterials(false)
    closeModal()
    onTaskAdded()
  }

  // ── Custom task ────────────────────────────────────────────────────────────

  async function addCustomTask() {
    if (!customName || !customPrice) return
    setCustomSaving(true)
    await fetch(`/api/jobs/${jobId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customName,
        description: customDesc || undefined,
        quantity: Number(customQty) || 1,
        unitPrice: Number(customPrice),
      }),
    })
    setCustomSaving(false)
    resetCustom()
    onTaskAdded()
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function closeModal() {
    setOpen(false)
    setSearch('')
    setSelectedCat('All')
    setCustomMode(false)
    setMaterialsStep(false)
    setPendingMaterials([])
    setDecisions({})
    setTruckLocations([])
    resetCustom()
  }

  function resetCustom() {
    setCustomName('')
    setCustomDesc('')
    setCustomPrice('')
    setCustomQty('1')
  }

  function setDecision(materialId: string, d: MaterialDecision) {
    setDecisions((prev) => ({ ...prev, [materialId]: d }))
  }

  function getBalance(locationId: string, itemId: string) {
    const loc = truckLocations.find((l) => l.id === locationId)
    return loc?.balances.find((b) => b.itemId === itemId)?.quantity ?? 0
  }

  const filtered = selectedCat === 'All' || selectedCat === 'Custom'
    ? tasks
    : tasks.filter((t) => t.category === selectedCat)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Add Task
      </button>
    )
  }

  // ── Render: Step 2 — materials ─────────────────────────────────────────────

  if (materialsStep) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                Step 2 of 2
              </span>
              <h2 className="text-base font-semibold text-gray-900">Materials for this Task</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Where did these parts come from? Inventory and the invoice will update automatically.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loadingLocations && (
              <p className="text-xs text-gray-400 text-center py-2">Loading inventory locations…</p>
            )}

            {pendingMaterials.map((m) => {
              const d = decisions[m.id] ?? { type: 'purchased', unitPrice: m.item.cost }
              const truckLocs = truckLocations.filter((l) => l.type === 'TRUCK')

              return (
                <div key={m.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{m.item.name}</div>
                      <div className="text-xs text-gray-400">
                        SKU: {m.item.sku} · Qty needed: {m.defaultQuantity}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 shrink-0">
                      {m.defaultQuantity} × {fmt(m.item.cost)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Truck options */}
                    {truckLocs.map((loc) => {
                      const balance = getBalance(loc.id, m.item.id)
                      const active =
                        d.type === 'truck' &&
                        (d as { type: 'truck'; locationId: string }).locationId === loc.id
                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            active
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`source-${m.id}`}
                            checked={active}
                            onChange={() =>
                              setDecision(m.id, {
                                type: 'truck',
                                locationId: loc.id,
                                unitPrice: m.item.defaultPrice ?? m.item.cost,
                              })
                            }
                            className="accent-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">
                              🚚 {loc.name}
                              {loc.technician && (
                                <span className="text-gray-400 text-xs ml-1">
                                  ({loc.technician.name})
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs ${balance > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {balance} in stock{balance <= 0 ? ' — will go negative' : ''}
                            </div>
                          </div>
                        </label>
                      )
                    })}

                    {/* Purchased today */}
                    <label
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        d.type === 'purchased'
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`source-${m.id}`}
                        checked={d.type === 'purchased'}
                        onChange={() =>
                          setDecision(m.id, { type: 'purchased', unitPrice: m.item.cost })
                        }
                        className="accent-amber-500 mt-0.5"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="text-sm font-medium text-gray-800">
                          🛒 Purchased today (supply house)
                        </div>
                        {d.type === 'purchased' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Cost paid:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(d as { unitPrice: number }).unitPrice}
                                onChange={(e) =>
                                  setDecision(m.id, {
                                    type: 'purchased',
                                    unitPrice: Number(e.target.value),
                                  })
                                }
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className="w-24 pl-6 pr-2 py-1 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Skip */}
                    <label
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        d.type === 'skip'
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`source-${m.id}`}
                        checked={d.type === 'skip'}
                        onChange={() => setDecision(m.id, { type: 'skip' })}
                        className="accent-gray-500"
                      />
                      <div className="text-sm text-gray-600">
                        ⏭ Skip — already have it / included in price
                      </div>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex gap-2">
            <button
              onClick={confirmMaterials}
              disabled={confirmingMaterials}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {confirmingMaterials ? 'Saving…' : 'Confirm & Add to Job'}
            </button>
            <button
              onClick={() => {
                closeModal()
                onTaskAdded()
              }}
              className="px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            >
              Skip all
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Step 1 — task picker ───────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Task to Job</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Category tabs */}
        <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {(categories.length > 0 ? categories : ['All', 'Custom']).map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCat(cat); setCustomMode(cat === 'Custom') }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{CATEGORY_ICONS[cat] ?? '🔧'}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        {!customMode && (
          <div className="px-4 pb-3">
            <input
              type="search"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Custom entry */}
        {customMode ? (
          <div className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto">
            <p className="text-sm text-gray-500">Enter a custom/a-la-carte line item.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Task Name *
              </label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Install customer-supplied valve"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description (optional)
              </label>
              <input
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Notes or details"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unit Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {customName && customPrice && (
              <p className="text-sm text-gray-700">
                Total:{' '}
                <span className="font-semibold text-emerald-700">
                  {fmt((Number(customQty) || 1) * Number(customPrice))}
                </span>
              </p>
            )}
            <button
              onClick={addCustomTask}
              disabled={!customName || !customPrice || customSaving}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {customSaving ? 'Adding…' : 'Add Custom Task'}
            </button>
          </div>
        ) : (
          /* Task list */
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No tasks match your search</p>
            )}
            {filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 leading-snug">
                    {task.name}
                  </div>
                  {task.description && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {task.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">{task.category}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    {fmt(task.unitPrice)}
                  </span>
                  <button
                    onClick={() => addTask(task)}
                    disabled={adding === task.id}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {adding === task.id ? '…' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
