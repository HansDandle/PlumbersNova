import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { CreateUserBody } from '@/types'

// GET /api/users
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role')

  const users = await prisma.user.findMany({
    where: role ? { role: role as any, companyId: session.companyId } : { companyId: session.companyId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: users })
}

// POST /api/users  (OWNER only)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body: CreateUserBody = await req.json()
    const hashed = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: { ...body, password: hashed, companyId: session.companyId },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
