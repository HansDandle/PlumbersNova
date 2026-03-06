'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'

type NavItem = {
  href: string
  label: string
  icon: string
  roles?: Role[]
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '⬛' },
  { href: '/leads', label: 'Leads', icon: '📋', roles: ['OWNER', 'DISPATCHER'] },
  { href: '/jobs', label: 'Jobs', icon: '🔧' },
  { href: '/dispatch', label: 'Dispatch', icon: '📅', roles: ['OWNER', 'DISPATCHER'] },
  { href: '/inventory', label: 'Inventory', icon: '📦', roles: ['OWNER', 'DISPATCHER'] },
  { href: '/invoices', label: 'Invoices', icon: '💲', roles: ['OWNER', 'DISPATCHER'] },
  { href: '/messages', label: 'Messages', icon: '💬', roles: ['OWNER', 'DISPATCHER'] },
  { href: '/settings', label: 'Settings', icon: '⚙️', roles: ['OWNER', 'DISPATCHER'] },
]

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()

  const items = NAV.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-blue-600">PlumbersNova</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <LogoutButton />
      </div>
    </div>
  )
}

function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
    >
      <span>🚪</span>
      Sign out
    </button>
  )
}
