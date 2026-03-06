'use client'

import { useState, useMemo, useCallback } from 'react'

type Task = {
  id: string
  category: string
  name: string
  description: string | null
  unitPrice: number
  isActive: boolean
}

type TaskMaterial = {
  id: string
  defaultQuantity: number
  item: { id: string; name: string; sku: string; cost: number }
}

type InventoryItem = {
  id: string
  name: string
  sku: string
  cost: number
  unit: string | null
}

type Props = {
  initialTasks: Task[]
  categories: string[]
  canEdit: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

export function PriceBookManager({ initialTasks, categories, canEdit }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [showInactive, setShowInactive] = useState(false)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCat, setEditCat] = useState('')
  const [saving, setSaving] = useState(false)

  // New task state
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [adding, setAdding] = useState(false)

  const allCats = ['All', ...categories]

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!showInactive && !t.isActive) return false
      if (selectedCat !== 'All' && t.category !== selectedCat) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.description ?? '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, search, selectedCat, showInactive])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of filtered) {
      const arr = map.get(t.category) ?? []
      arr.push(t)
      map.set(t.category, arr)
    }
    return map
  }, [filtered])

  function startEdit(task: Task) {
    setEditId(task.id)
    setEditName(task.name)
    setEditDesc(task.description ?? '')
    setEditPrice(String(task.unitPrice))
    setEditCat(task.category)
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    const res = await fetch(`/api/pricebook/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, unitPrice: Number(editPrice), category: editCat }),
    })
    const updated: Task = await res.json()
    setTasks((prev) => prev.map((t) => (t.id === editId ? updated : t)))
    setEditId(null)
    setSaving(false)
  }

  async function toggleActive(task: Task) {
    const res = await fetch(`/api/pricebook/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !task.isActive }),
    })
    const updated: Task = await res.json()
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
  }

  async function addTask() {
    if (!newName || !newPrice || !newCat) return
    setAdding(true)
    const res = await fetch('/api/pricebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat, name: newName, description: newDesc, unitPrice: Number(newPrice) }),
    })
    const created: Task = await res.json()
    setTasks((prev) => [...prev, created])
    setNewCat('')
    setNewName('')
    setNewDesc('')
    setNewPrice('')
    setShowAdd(false)
    setAdding(false)
  }

  // ── Materials management ───────────────────────────────────────────────────

  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set())
  const [taskMaterials, setTaskMaterials] = useState<Record<string, TaskMaterial[]>>({})
  const [loadingMatFor, setLoadingMatFor] = useState<Set<string>>(new Set())

  // Link-item form
  const [linkTaskId, setLinkTaskId] = useState<string | null>(null)
  const [linkSearch, setLinkSearch] = useState('')
  const [linkItems, setLinkItems] = useState<InventoryItem[]>([])
  const [linkSelectedId, setLinkSelectedId] = useState<string | null>(null)
  const [linkQty, setLinkQty] = useState('1')
  const [linkSaving, setLinkSaving] = useState(false)

  const loadMaterials = useCallback(async (taskId: string) => {
    setLoadingMatFor((s) => new Set(s).add(taskId))
    const res = await fetch(`/api/pricebook/${taskId}/materials`)
    const mats: TaskMaterial[] = await res.json()
    setTaskMaterials((prev) => ({ ...prev, [taskId]: mats }))
    setLoadingMatFor((s) => { const n = new Set(s); n.delete(taskId); return n })
  }, [])

  function toggleMaterials(taskId: string) {
    const next = new Set(expandedMaterials)
    if (next.has(taskId)) {
      next.delete(taskId)
    } else {
      next.add(taskId)
      if (!taskMaterials[taskId]) loadMaterials(taskId)
    }
    setExpandedMaterials(next)
  }

  async function searchLinkItems(q: string) {
    setLinkSearch(q)
    setLinkSelectedId(null)
    if (!q) { setLinkItems([]); return }
    const res = await fetch(`/api/inventory?search=${encodeURIComponent(q)}&limit=10`)
    const data = await res.json()
    setLinkItems(Array.isArray(data) ? data : data.items ?? [])
  }

  async function saveMaterialLink(taskId: string) {
    if (!linkSelectedId) return
    setLinkSaving(true)
    const res = await fetch(`/api/pricebook/${taskId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: linkSelectedId, defaultQuantity: Number(linkQty) || 1 }),
    })
    if (res.ok) {
      await loadMaterials(taskId)
      setLinkTaskId(null)
      setLinkSearch('')
      setLinkItems([])
      setLinkSelectedId(null)
      setLinkQty('1')
    }
    setLinkSaving(false)
  }

  async function deleteMaterial(materialId: string, taskId: string) {
    await fetch(`/api/pricebook/materials/${materialId}`, { method: 'DELETE' })
    setTaskMaterials((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).filter((m) => m.id !== materialId),
    }))
  }

  async function updateMaterialQty(materialId: string, taskId: string, qty: number) {
    await fetch(`/api/pricebook/materials/${materialId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultQuantity: qty }),
    })
    setTaskMaterials((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).map((m) =>
        m.id === materialId ? { ...m, defaultQuantity: qty } : m
      ),
    }))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
          {canEdit && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {allCats.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCat === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add task form */}
      {showAdd && canEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">New Task</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                list="category-list"
                placeholder="e.g. Drain Cleaning"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="category-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Task Name *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Task name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Notes or caveats"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTask}
              disabled={!newName || !newPrice || !newCat || adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? 'Saving…' : 'Save Task'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-400">
        {filtered.length} task{filtered.length !== 1 ? 's' : ''} shown
        {!showInactive ? ' (active only)' : ''}
      </p>

      {/* Task table grouped by category */}
      {grouped.size === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No tasks match your filter</div>
      ) : (
        Array.from(grouped.entries()).map(([cat, catTasks]) => (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{cat}</h3>
              <span className="text-xs text-gray-400">{catTasks.length} tasks</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {catTasks.map((task) => {
                  const isEditing = editId === task.id

                  if (isEditing) {
                    return (
                      <tr key={task.id} className="bg-blue-50/40">
                        <td className="px-4 py-3 w-full" colSpan={3}>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                value={editCat}
                                onChange={(e) => setEditCat(e.target.value)}
                                list="category-list"
                                placeholder="Category"
                                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded text-xs hover:bg-gray-50">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <>
                    <tr key={task.id} className={`hover:bg-gray-50/60 transition-colors ${!task.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 flex-1">
                        <div className="font-medium text-gray-900 leading-snug">{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>
                        )}
                        {!task.isActive && <span className="text-xs text-red-400">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(task.unitPrice)}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleMaterials(task.id)}
                            className={`text-xs transition-colors mr-3 ${
                              expandedMaterials.has(task.id)
                                ? 'text-blue-600 font-medium'
                                : 'text-gray-400 hover:text-blue-600'
                            }`}
                          >
                            🔩 Materials
                            {taskMaterials[task.id]?.length
                              ? ` (${taskMaterials[task.id].length})`
                              : ''}
                          </button>
                          <button
                            onClick={() => startEdit(task)}
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleActive(task)}
                            className={`text-xs transition-colors ${
                              task.isActive
                                ? 'text-gray-400 hover:text-red-500'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                          >
                            {task.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Materials panel */}
                    {expandedMaterials.has(task.id) && (
                      <tr key={`${task.id}-mats`}>
                        <td colSpan={3} className="px-4 pb-4 pt-0 bg-blue-50/30">
                          <div className="border border-blue-100 rounded-xl p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-600 mb-1">
                              Default Materials — added automatically when this task is used on a job
                            </div>

                            {loadingMatFor.has(task.id) && (
                              <p className="text-xs text-gray-400">Loading…</p>
                            )}

                            {(taskMaterials[task.id] ?? []).length === 0 && !loadingMatFor.has(task.id) && (
                              <p className="text-xs text-gray-400 italic">No materials linked yet</p>
                            )}

                            {(taskMaterials[task.id] ?? []).map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-800">{m.item.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">SKU: {m.item.sku}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <label className="text-xs text-gray-500">Qty:</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    defaultValue={m.defaultQuantity}
                                    onBlur={(e) => {
                                      const v = Number(e.target.value)
                                      if (v > 0 && v !== m.defaultQuantity)
                                        updateMaterialQty(m.id, task.id, v)
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                </div>
                                <button
                                  onClick={() => deleteMaterial(m.id, task.id)}
                                  className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}

                            {/* Link item form */}
                            {linkTaskId === task.id ? (
                              <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-gray-700">Search inventory items to link</p>
                                <input
                                  type="search"
                                  placeholder="Type item name or SKU…"
                                  value={linkSearch}
                                  onChange={(e) => searchLinkItems(e.target.value)}
                                  autoFocus
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                                {linkItems.length > 0 && (
                                  <div className="border border-gray-200 rounded divide-y divide-gray-100 max-h-36 overflow-y-auto">
                                    {linkItems.map((item) => (
                                      <button
                                        key={item.id}
                                        onClick={() => {
                                          setLinkSelectedId(item.id)
                                          setLinkSearch(item.name)
                                          setLinkItems([])
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors ${
                                          linkSelectedId === item.id ? 'bg-blue-50 font-medium' : ''
                                        }`}
                                      >
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-gray-400 ml-2">
                                          {item.sku} · ${item.cost.toFixed(2)}
                                          {item.unit ? ` / ${item.unit}` : ''}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500 whitespace-nowrap">Default qty:</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={linkQty}
                                    onChange={(e) => setLinkQty(e.target.value)}
                                    className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                  <button
                                    onClick={() => saveMaterialLink(task.id)}
                                    disabled={!linkSelectedId || linkSaving}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors ml-auto"
                                  >
                                    {linkSaving ? 'Linking…' : 'Link Item'}
                                  </button>
                                  <button
                                    onClick={() => { setLinkTaskId(null); setLinkSearch(''); setLinkItems([]) }}
                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setLinkTaskId(task.id)
                                  setLinkSearch('')
                                  setLinkSelectedId(null)
                                  setLinkQty('1')
                                  setLinkItems([])
                                }}
                                className="text-xs text-blue-600 hover:underline mt-1"
                              >
                                + Link inventory item
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
