import { NextRequest, NextResponse } from 'next/server'
import { getImageDetail } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const id = pathSegments.join('/')
  const detail = getImageDetail(id)

  if (!detail) {
    return new NextResponse('Not found', { status: 404 })
  }

  return NextResponse.json(detail)
}
