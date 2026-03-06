'use client'

import { useState, useEffect, useCallback } from 'react'
import { AddTaskModal } from './AddTaskModal'

type JobTask = {
  id: string
  name: string
  description?: string | null
  quantity: number
  unitPrice: number
  total: number
  priceBookTask?: { category: string } | null
}

type Props = {
  jobId: string
  readOnly?: boolean // true when job is INVOICED or PAID
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

export function JobTasksSection({ jobId, readOnly = false }: Props) {
  const [tasks, setTasks] = useState<JobTask[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}/tasks`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [jobId])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function removeTask(taskId: string) {
    setRemoving(taskId)
    await fetch(`/api/jobs/${jobId}/tasks/${taskId}`, { method: 'DELETE' })
    setRemoving(null)
    loadTasks()
  }

  const subtotal = tasks.reduce((s, t) => s + t.total, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Tasks / Flat Rate Items
        </h3>
        {!readOnly && <AddTaskModal jobId={jobId} onTaskAdded={loadTasks} />}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-400">No tasks added yet.</p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-1">
              Click "Add Task" to choose from the price book or enter a custom line.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Task
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Qty
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Unit Price
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                {!readOnly && <th className="w-8" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 leading-snug">{task.name}</div>
                    {task.description && (
                      <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>
                    )}
                    {task.priceBookTask?.category && (
                      <div className="text-xs text-blue-500 mt-0.5">
                        {task.priceBookTask.category}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden sm:table-cell">
                    {task.quantity % 1 === 0 ? task.quantity : task.quantity.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden sm:table-cell">
                    {fmt(task.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmt(task.total)}
                  </td>
                  {!readOnly && (
                    <td className="pr-3 py-3 text-right">
                      <button
                        onClick={() => removeTask(task.id)}
                        disabled={removing === task.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none"
                        title="Remove task"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={readOnly ? 3 : 4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Tasks Subtotal
                </td>
                <td className={`px-4 py-3 text-right text-sm font-bold text-emerald-700 ${!readOnly ? 'pr-3' : ''}`}>
                  {fmt(subtotal)}
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
