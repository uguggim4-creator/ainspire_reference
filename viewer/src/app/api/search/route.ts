import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface ImageEntry {
  id: string
  work: string
  filename: string
  angle?: string
  shot_size?: string
  people_count?: string
  color_mood?: string
  saturation?: string
  mood?: string[]
  setting?: string
  location_type?: string
  lighting?: string
  time_of_day?: string
  composition?: string[]
  reference_score?: number
  palette_hex?: string[]
  description?: string
  work_key?: string
  [key: string]: unknown
}

interface DataJson {
  images: ImageEntry[]
  options: Record<string, string[]>
  total: number
}

let dataCache: DataJson | null = null

function loadData(): DataJson {
  if (dataCache) return dataCache
  const filePath = path.join(process.cwd(), 'public', 'data.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  dataCache = JSON.parse(raw) as DataJson
  return dataCache
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const data = loadData()

  // filters_only 모드
  if (searchParams.get('filters_only') === 'true') {
    return NextResponse.json(
      { options: data.options },
      { headers: corsHeaders() }
    )
  }

  const parseList = (key: string) => {
    const v = searchParams.get(key)
    return v ? v.split(',').map(s => s.trim()).filter(Boolean) : []
  }

  const filterAngle       = parseList('angle')
  const filterShotSize    = parseList('shot_size')
  const filterPeopleCount = parseList('people_count')
  const filterColorMood   = parseList('color_mood')
  const filterSaturation  = parseList('saturation')
  const filterMood        = parseList('mood')
  const filterSetting     = parseList('setting')
  const filterLocationType = parseList('location_type')
  const filterLighting    = parseList('lighting')
  const filterTimeOfDay   = parseList('time_of_day')
  const filterComposition = parseList('composition')
  const filterWork        = parseList('work')

  const minScore = parseFloat(searchParams.get('min_score') ?? '0') || 0
  const query    = (searchParams.get('q') ?? '').toLowerCase().trim()
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit    = Math.min(isNaN(rawLimit) ? 20 : rawLimit, 50)

  const match = (actual: string | undefined, filter: string[]) =>
    filter.length === 0 || (actual != null && filter.includes(actual))

  const matchArray = (actual: string[] | undefined, filter: string[]) =>
    filter.length === 0 || (actual != null && filter.some(f => actual.includes(f)))

  let results = data.images.filter(img => {
    if (!match(img.angle, filterAngle)) return false
    if (!match(img.shot_size, filterShotSize)) return false
    if (!match(img.people_count, filterPeopleCount)) return false
    if (!match(img.color_mood, filterColorMood)) return false
    if (!match(img.saturation, filterSaturation)) return false
    if (!matchArray(img.mood, filterMood)) return false
    if (!match(img.setting, filterSetting)) return false
    if (!match(img.location_type, filterLocationType)) return false
    if (!match(img.lighting, filterLighting)) return false
    if (!match(img.time_of_day, filterTimeOfDay)) return false
    if (!matchArray(img.composition, filterComposition)) return false
    if (!match(img.work, filterWork)) return false
    if ((img.reference_score ?? 0) < minScore) return false
    if (query && !(img.description ?? '').toLowerCase().includes(query)) return false
    return true
  })

  // reference_score 높은 순 정렬
  results.sort((a, b) => (b.reference_score ?? 0) - (a.reference_score ?? 0))

  const sliced = results.slice(0, limit)

  const images = sliced.map(img => {
    const workKey = img.work_key ?? ''
    const filename = img.filename
    return {
      id: img.id,
      work: img.work,
      filename,
      thumb_url: `${supabaseUrl}/storage/v1/object/public/ainspire/thumbs/${workKey}/${filename}`,
      original_url: `${supabaseUrl}/storage/v1/object/public/ainspire/originals/${workKey}/${filename}`,
      description: img.description,
      angle: img.angle,
      shot_size: img.shot_size,
      people_count: img.people_count,
      color_mood: img.color_mood,
      saturation: img.saturation,
      mood: img.mood,
      setting: img.setting,
      location_type: img.location_type,
      lighting: img.lighting,
      time_of_day: img.time_of_day,
      composition: img.composition,
      reference_score: img.reference_score,
      palette_hex: img.palette_hex,
      work_key: workKey,
    }
  })

  return NextResponse.json(
    { count: results.length, images },
    { headers: corsHeaders() }
  )
}
