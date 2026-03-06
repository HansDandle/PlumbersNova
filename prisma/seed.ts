import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // Create demo company (matches the bootstrap-company created by migration)
  const company = await prisma.company.upsert({
    where: { id: 'bootstrap-company' },
    update: {},
    create: {
      id: 'bootstrap-company',
      name: 'Demo Plumbing Co.',
    },
  })

  // Create owner
  const ownerPassword = await bcrypt.hash('password123', 12)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@plumbersnova.com' },
    update: {},
    create: {
      email: 'owner@plumbersnova.com',
      name: 'Alex Owner',
      phone: '555-0100',
      role: 'OWNER',
      password: ownerPassword,
      companyId: company.id,
    },
  })

  // Create dispatcher
  const dispatcherPassword = await bcrypt.hash('password123', 12)
  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatch@plumbersnova.com' },
    update: {},
    create: {
      email: 'dispatch@plumbersnova.com',
      name: 'Jamie Dispatcher',
      phone: '555-0101',
      role: 'DISPATCHER',
      password: dispatcherPassword,
      companyId: company.id,
    },
  })

  // Create technicians
  const techPassword = await bcrypt.hash('password123', 12)
  const mike = await prisma.user.upsert({
    where: { email: 'mike@plumbersnova.com' },
    update: {},
    create: {
      email: 'mike@plumbersnova.com',
      name: 'Mike',
      phone: '555-0102',
      role: 'TECHNICIAN',
      password: techPassword,
      companyId: company.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'sarah@plumbersnova.com' },
    update: {},
    create: {
      email: 'sarah@plumbersnova.com',
      name: 'Sarah',
      phone: '555-0103',
      role: 'TECHNICIAN',
      password: techPassword,
      companyId: company.id,
    },
  })

  // Create inventory items
  const items = [
    { sku: 'TEE-075', name: '3/4 Copper Tee', category: 'Copper Fittings', cost: 1.40, defaultPrice: 3.50 },
    { sku: 'COUP-075', name: '3/4 Copper Coupling', category: 'Copper Fittings', cost: 0.95, defaultPrice: 2.25 },
    { sku: 'ELBOW-075', name: '3/4 Copper 90 Elbow', category: 'Copper Fittings', cost: 1.20, defaultPrice: 2.75 },
    { sku: 'BALL-075', name: '3/4 Ball Valve', category: 'Valves', cost: 8.50, defaultPrice: 18.00 },
    { sku: 'WC-FLAP', name: 'Toilet Flapper', category: 'Toilet Parts', cost: 4.50, defaultPrice: 12.00 },
    { sku: 'P-TRAP-1.5', name: '1.5" P-Trap', category: 'Drain', cost: 6.00, defaultPrice: 15.00 },
    { sku: 'WEFILL', name: 'Fill Valve (Universal)', category: 'Toilet Parts', cost: 9.00, defaultPrice: 22.00 },
  ]

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { companyId_sku: { companyId: company.id, sku: item.sku } },
      update: {},
      create: { ...item, companyId: company.id },
    })
  }

  // Create locations
  const warehouse = await prisma.inventoryLocation.upsert({
    where: { id: 'warehouse-main' },
    update: {},
    create: {
      id: 'warehouse-main',
      name: 'Warehouse',
      type: 'WAREHOUSE',
      companyId: company.id,
    },
  })

  const mikeTruck = await prisma.inventoryLocation.create({
    data: {
      name: 'Truck — Mike',
      type: 'TRUCK',
      technicianId: mike.id,
      companyId: company.id,
    },
  }).catch(() => prisma.inventoryLocation.findFirst({ where: { technicianId: mike.id } }))

  // Set warehouse balances
  const allItems = await prisma.inventoryItem.findMany({ where: { companyId: company.id } })
  for (const item of allItems) {
    await prisma.inventoryBalance.upsert({
      where: { locationId_itemId: { locationId: warehouse.id, itemId: item.id } },
      update: {},
      create: {
        locationId: warehouse.id,
        itemId: item.id,
        quantity: 100,
      },
    })
  }

  // Create a sample customer and job
  const customer = await prisma.customer.create({
    data: {
      name: 'John Smith',
      phone: '555-1111',
      address: '123 Main St, Springfield',
      companyId: company.id,
    },
  })

  await prisma.job.create({
    data: {
      customerId: customer.id,
      address: '123 Main St, Springfield',
      problemDescription: 'Kitchen sink leaking under cabinet',
      technicianId: mike.id,
      status: 'TECHNICIAN_ASSIGNED',
      scheduledTime: new Date(),
      companyId: company.id,
    },
  })

  console.log('Seed complete.')
  console.log('Login credentials (all use password: password123):')
  console.log('  owner@plumbersnova.com')
  console.log('  dispatch@plumbersnova.com')
  console.log('  mike@plumbersnova.com')
  console.log('  sarah@plumbersnova.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
