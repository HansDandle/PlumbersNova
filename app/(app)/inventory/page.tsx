import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdjustBalanceModal from '@/components/inventory/AdjustBalanceModal'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { location?: string }
}) {
  const [locations, items] = await Promise.all([
    prisma.inventoryLocation.findMany({
      include: { technician: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const selectedLocation = searchParams.location ?? locations[0]?.id

  const balances = selectedLocation
    ? await prisma.inventoryBalance.findMany({
        where: { locationId: selectedLocation },
        include: { item: true },
        orderBy: { item: { name: 'asc' } },
      })
    : []

  const location = locations.find((l) => l.id === selectedLocation)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        {location && (
          <AdjustBalanceModal locationId={location.id} locationName={location.name} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Location list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-700">Locations</div>
            <ul className="divide-y divide-gray-100">
              {locations.map((loc) => (
                <li key={loc.id}>
                  <Link
                    href={`/inventory?location=${loc.id}`}
                    className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      loc.id === selectedLocation ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <p>{loc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{loc.type.toLowerCase().replace('_', ' ')}</p>
                    {loc.technician && (
                      <p className="text-xs text-blue-500 mt-0.5">{loc.technician.name}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Balances */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{location?.name ?? 'Select a location'}</h2>
            </div>

            {balances.length === 0 ? (
              <p className="text-center py-12 text-sm text-gray-400">No inventory recorded at this location</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-left text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {balances.map((b) => (
                    <tr key={b.id} className={b.quantity < 0 ? 'bg-red-50' : ''}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{b.item.sku}</td>
                      <td className="px-5 py-3 font-medium">{b.item.name}</td>
                      <td className="px-5 py-3 text-gray-500">{b.item.category ?? '—'}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${b.quantity < 0 ? 'text-red-600' : ''}`}>
                        {b.quantity}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">${b.item.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
