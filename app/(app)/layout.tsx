import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  // If session exists but has no companyId (stale pre-multitenant cookie), force re-login
  if (!session.companyId) redirect('/api/auth/logout-redirect')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white">
        <Sidebar role={session.role} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64 min-h-screen">
        {/* Mobile top nav */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">PlumbersNova</span>
          <MobileNav role={session.role} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
