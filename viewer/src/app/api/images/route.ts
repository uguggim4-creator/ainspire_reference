import { NextRequest, NextResponse } from 'next/server'
import { loadLiteImages } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const images = loadLiteImages()
  const total = images.length

  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  if (pageParam && limitParam) {
    const page = parseInt(pageParam, 10)
    const limit = parseInt(limitParam, 10)
    const start = (page - 1) * limit
    const paged = images.slice(start, start + limit)
    return NextResponse.json({ images: paged, total })
  }

  return NextResponse.json({ images, total })
}
