import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const REFERENCE_DIR = path.resolve('E:/pinterest/reference')

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const filePath = path.join(REFERENCE_DIR, ...pathSegments)

  // security: prevent path traversal
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(REFERENCE_DIR) + path.sep) && resolved !== path.resolve(REFERENCE_DIR)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = path.extname(resolved).toLowerCase()
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

  const buffer = fs.readFileSync(resolved)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
