import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PriceBookManager } from './PriceBookManager'

export default async function PriceBookPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.companyId) redirect('/api/auth/logout-redirect')

  const tasks = await prisma.priceBookTask.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  const categories = Array.from(new Set(tasks.map((t) => t.category))).sort()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Price Book</h1>
        <p className="text-sm text-gray-500 mt-1">
          Flat-rate tasks that technicians can add to any job. Pre-loaded from your 2022 master price book.
        </p>
      </div>
      <PriceBookManager
        initialTasks={tasks}
        categories={categories}
        canEdit={session.role === 'OWNER' || session.role === 'DISPATCHER'}
      />
    </div>
  )
}
