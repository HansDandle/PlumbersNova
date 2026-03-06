import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import type { AddJobNoteBody } from '@/types'

type Params = { params: { id: string } }

// GET /api/jobs/:id/notes
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await prisma.jobNote.findMany({
    where: { jobId: params.id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: notes })
}

// POST /api/jobs/:id/notes
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: AddJobNoteBody = await req.json()

    const note = await prisma.jobNote.create({
      data: {
        jobId: params.id,
        authorId: session.id,
        content: body.content,
      },
      include: { author: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: note }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
