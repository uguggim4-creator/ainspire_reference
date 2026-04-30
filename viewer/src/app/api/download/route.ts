import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

const REFERENCE_DIR = path.resolve('E:/pinterest/reference')

export async function POST(req: NextRequest) {
  const body = await req.json()
  const imagePaths: string[] = body.paths || []

  if (imagePaths.length === 0) {
    return new NextResponse('No paths provided', { status: 400 })
  }

  const zip = new JSZip()

  for (const imgPath of imagePaths) {
    const filePath = path.join(REFERENCE_DIR, imgPath)
    const resolved = path.resolve(filePath)

    if (!resolved.startsWith(path.resolve(REFERENCE_DIR))) continue
    if (!fs.existsSync(resolved)) continue

    // folder/filename in zip
    const parts = imgPath.split('/')
    const zipName = parts.join('_')
    const buffer = fs.readFileSync(resolved)
    zip.file(zipName, buffer)
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="references.zip"',
    },
  })
}
