'use client'

import { useState, useEffect, useCallback } from 'react'

type PriceBookTask = {
  id: string
  category: string
  name: string
  description?: string | null
  unitPrice: number
}

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
    if (open) loadTasks()
  }, [open, loadTasks])

  async function addTask(task: PriceBookTask) {
    setAdding(task.id)
    await fetch(`/api/jobs/${jobId}/tasks`, {
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
    setAdding(null)
    onTaskAdded()
  }

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
    setCustomName('')
    setCustomDesc('')
    setCustomPrice('')
    setCustomQty('1')
    onTaskAdded()
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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Task to Job</h2>
          <button
            onClick={() => { setOpen(false); setSearch(''); setSelectedCat('All'); setCustomMode(false) }}
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
