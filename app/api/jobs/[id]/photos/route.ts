import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: { id: string } }

// GET /api/jobs/:id/photos
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.job.findFirst({ where: { id: params.id, companyId: session.companyId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const photos = await prisma.jobPhoto.findMany({
    where: { jobId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: photos })
}

/**
 * POST /api/jobs/:id/photos
 *
 * The client should upload the file to storage (e.g. S3 / Cloudflare R2)
 * first and then send the resulting URL here.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body: { url: string; caption?: string } = await req.json()

    const job = await prisma.job.findFirst({ where: { id: params.id, companyId: session.companyId } })
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const photo = await prisma.jobPhoto.create({
      data: {
        jobId: params.id,
        url: body.url,
        caption: body.caption,
      },
    })

    return NextResponse.json({ data: photo }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
