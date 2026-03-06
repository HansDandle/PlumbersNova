import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

/**
 * POST /api/auth/signup
 *
 * Creates a new Company + OWNER user in a single transaction.
 * Body: { companyName, name, email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      companyName: string
      name: string
      email: string
      password: string
    }

    if (!body.companyName || !body.name || !body.email || !body.password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(body.password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: body.companyName },
      })

      return tx.user.create({
        data: {
          companyId: company.id,
          name: body.name,
          email: body.email,
          password: hashed,
          role: 'OWNER',
        },
      })
    })

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    })

    const response = NextResponse.json({
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 })

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
