import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { customerId?: string; leadId?: string }
}) {
  // Load recent conversations — group by customer
  const recentMessages = await prisma.message.findMany({
    where: {
      ...(searchParams.customerId ? { customerId: searchParams.customerId } : {}),
      ...(searchParams.leadId ? { leadId: searchParams.leadId } : {}),
    },
    include: {
      customer: true,
      lead: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Get unique customer threads
  const seen = new Set<string>()
  const threads = recentMessages.filter((m) => {
    const key = m.customerId ?? m.leadId ?? m.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const activeThread = searchParams.customerId
    ? await prisma.message.findMany({
        where: { customerId: searchParams.customerId },
        orderBy: { createdAt: 'asc' },
      })
    : searchParams.leadId
    ? await prisma.message.findMany({
        where: { leadId: searchParams.leadId },
        orderBy: { createdAt: 'asc' },
      })
    : []

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[600px]">
        {/* Thread list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">Conversations</div>
          {threads.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No messages yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((m) => {
                const name = m.customer?.name ?? m.lead?.name ?? m.customer?.phone ?? '—'
                const href = m.customerId
                  ? `/messages?customerId=${m.customerId}`
                  : `/messages?leadId=${m.leadId}`

                return (
                  <li key={m.id}>
                    <Link
                      href={href}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        (m.customerId && searchParams.customerId === m.customerId) ||
                        (m.leadId && searchParams.leadId === m.leadId)
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Active conversation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          {activeThread.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400">Select a conversation</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeThread.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-sm rounded-xl px-3 py-2 text-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.channel} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
