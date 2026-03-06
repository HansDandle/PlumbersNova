type BadgeType = 'job' | 'lead' | 'invoice'

const JOB_COLORS: Record<string, string> = {
  JOB_REQUESTED:      'bg-gray-100 text-gray-600',
  SCHEDULED:          'bg-blue-100 text-blue-700',
  TECHNICIAN_ASSIGNED:'bg-indigo-100 text-indigo-700',
  EN_ROUTE:           'bg-violet-100 text-violet-700',
  IN_PROGRESS:        'bg-amber-100 text-amber-700',
  COMPLETED:          'bg-green-100 text-green-700',
  INVOICED:           'bg-teal-100 text-teal-700',
  PAID:               'bg-emerald-100 text-emerald-700',
}

const LEAD_COLORS: Record<string, string> = {
  NEW:       'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
  CLOSED:    'bg-gray-100 text-gray-500',
}

const INVOICE_COLORS: Record<string, string> = {
  UNSENT: 'bg-gray-100 text-gray-600',
  SENT:   'bg-blue-100 text-blue-700',
  PAID:   'bg-green-100 text-green-700',
}

const LABELS: Record<string, string> = {
  JOB_REQUESTED: 'Requested',
  TECHNICIAN_ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
}

export function StatusBadge({ value, type }: { value: string; type: BadgeType }) {
  const map = type === 'job' ? JOB_COLORS : type === 'lead' ? LEAD_COLORS : INVOICE_COLORS
  const color = map[value] ?? 'bg-gray-100 text-gray-600'
  const label = LABELS[value] ?? value.replace(/_/g, ' ')

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  )
}
