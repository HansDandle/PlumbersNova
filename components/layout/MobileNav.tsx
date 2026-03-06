'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'

const NAV = [
  { href: '/', label: 'Home', roles: undefined },
  { href: '/jobs', label: 'Jobs', roles: undefined },
  { href: '/leads', label: 'Leads', roles: ['OWNER', 'DISPATCHER'] as Role[] },
  { href: '/dispatch', label: 'Dispatch', roles: ['OWNER', 'DISPATCHER'] as Role[] },
  { href: '/inventory', label: 'Inventory', roles: ['OWNER', 'DISPATCHER'] as Role[] },
  { href: '/invoices', label: 'Invoices', roles: ['OWNER', 'DISPATCHER'] as Role[] },
  { href: '/messages', label: 'Messages', roles: ['OWNER', 'DISPATCHER'] as Role[] },
  { href: '/settings', label: 'Settings', roles: ['OWNER', 'DISPATCHER'] as Role[] },
]

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = NAV.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-64 bg-white shadow-xl flex flex-col">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xl font-bold text-blue-600">PlumbersNova</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
