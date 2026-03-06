import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await getSession()
  if (session?.role !== 'OWNER' && session?.role !== 'DISPATCHER') {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Team */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Team Members</h2>
          {session.role === 'OWNER' && (
            <button className="text-sm text-blue-600 hover:underline font-medium">
              + Add User
            </button>
          )}
        </div>

        <ul className="divide-y divide-gray-100">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                {u.phone && <p className="text-xs text-gray-400 mt-0.5">{u.phone}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                u.role === 'OWNER'
                  ? 'bg-purple-100 text-purple-700'
                  : u.role === 'DISPATCHER'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {u.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Integrations */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Integrations</h2>

        <div className="space-y-3">
          <IntegrationRow
            name="Twilio SMS"
            description="Inbound SMS, missed call auto-reply, appointment notifications"
            status="Configure"
          />
          <IntegrationRow
            name="QuickBooks"
            description="Sync paid invoices to QuickBooks Online"
            status="Configure"
          />
          <IntegrationRow
            name="Xero"
            description="Sync paid invoices to Xero"
            status="Configure"
          />
        </div>
      </section>
    </div>
  )
}

function IntegrationRow({
  name,
  description,
  status,
}: {
  name: string
  description: string
  status: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button className="text-sm text-blue-600 hover:underline font-medium shrink-0 ml-4">
        {status}
      </button>
    </div>
  )
}
