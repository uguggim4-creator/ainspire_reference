import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const REFERENCE_DIR = path.resolve('E:/pinterest/reference')
const THUMB_CACHE = path.resolve('E:/pinterest/reference/_thumbs')

const THUMB_WIDTH = 480
const THUMB_QUALITY = 75

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const originalPath = path.join(REFERENCE_DIR, ...pathSegments)

  const resolved = path.resolve(originalPath)
  if (!resolved.startsWith(path.resolve(REFERENCE_DIR) + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // 캐시 경로
  const cachePath = path.join(THUMB_CACHE, ...pathSegments)
  const cacheDir = path.dirname(cachePath)

  // 캐시 히트
  if (fs.existsSync(cachePath)) {
    const buffer = fs.readFileSync(cachePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  }

  // 썸네일 생성
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }

    const buffer = await sharp(resolved)
      .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY })
      .toBuffer()

    fs.writeFileSync(cachePath, buffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    // sharp 실패 시 원본 반환
    const buffer = fs.readFileSync(resolved)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
}
