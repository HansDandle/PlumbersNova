import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

const SAFE_SELECT = { id: true, name: true, email: true, phone: true, role: true, createdAt: true }

// GET /api/users/:id
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Users may view their own profile; owners may view any
  if (session.role !== 'OWNER' && session.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: SAFE_SELECT,
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: user })
}

// PATCH /api/users/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role !== 'OWNER' && session.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body: { name?: string; phone?: string; password?: string; role?: string } = await req.json()

    const data: any = { ...body }
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12)
    }
    // Only owner may change role
    if (body.role && session.role !== 'OWNER') {
      delete data.role
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: SAFE_SELECT,
    })

    return NextResponse.json({ data: user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/:id  (OWNER only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { ok: true } })
}
