import fs from 'fs'
import path from 'path'
import { ImageMeta } from '@/types'

const REFERENCE_DIR = path.resolve('E:/pinterest/reference')

let cache: ImageMeta[] | null = null

export function loadAllImages(): ImageMeta[] {
  if (cache) return cache

  const result: ImageMeta[] = []

  let works: string[]
  try {
    works = fs.readdirSync(REFERENCE_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_'))
      .map(d => d.name)
  } catch {
    return []
  }

  for (const work of works) {
    const indexPath = path.join(REFERENCE_DIR, work, '_index.json')
    if (!fs.existsSync(indexPath)) continue

    let entries: ImageMeta[]
    try {
      const raw = fs.readFileSync(indexPath, 'utf-8')
      entries = JSON.parse(raw)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (entry._excluded || !entry.is_scene) continue
      const id = `${work}/${entry.filename}`
      result.push({
        ...entry,
        work,
        imagePath: id,
        id,
      })
    }
  }

  cache = result
  return result
}

// 그리드용 경량 메타 (description 제외, palette_hex 포함)
export function loadLiteImages(): Record<string, unknown>[] {
  const all = loadAllImages()
  return all.map(img => ({
    id: img.id,
    work: img.work,
    filename: img.filename,
    angle: img.angle,
    shot_size: img.shot_size,
    people_count: img.people_count,
    color_mood: img.color_mood,
    saturation: img.saturation,
    mood: img.mood,
    composition: img.composition,
    setting: img.setting,
    location_type: img.location_type,
    lighting: img.lighting,
    time_of_day: img.time_of_day,
    reference_score: img.reference_score,
    palette_hex: img.palette_hex,
  }))
}

export interface IndexData {
  images: Record<string, unknown>[]
  options: {
    angle: string[]
    shot_size: string[]
    people_count: string[]
    color_mood: string[]
    saturation: string[]
    mood: string[]
    setting: string[]
    location_type: string[]
    lighting: string[]
    time_of_day: string[]
    composition: string[]
    work: string[]
  }
  total: number
}

export function buildIndex(): IndexData {
  const all = loadAllImages()
  const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean).sort()

  const images = all.map(img => ({
    id: img.id,
    work: img.work,
    filename: img.filename,
    angle: img.angle,
    shot_size: img.shot_size,
    people_count: img.people_count,
    color_mood: img.color_mood,
    saturation: img.saturation,
    mood: img.mood,
    composition: img.composition,
    setting: img.setting,
    location_type: img.location_type,
    lighting: img.lighting,
    time_of_day: img.time_of_day,
    reference_score: img.reference_score,
    palette_hex: img.palette_hex,
  }))

  const options = {
    angle: uniq(all.map(i => i.angle)),
    shot_size: uniq(all.map(i => i.shot_size)),
    people_count: uniq(all.map(i => i.people_count)),
    color_mood: uniq(all.map(i => i.color_mood)),
    saturation: uniq(all.map(i => i.saturation)),
    mood: uniq(all.flatMap(i => i.mood || [])),
    setting: uniq(all.map(i => i.setting)),
    location_type: uniq(all.map(i => i.location_type)),
    lighting: uniq(all.map(i => i.lighting)),
    time_of_day: uniq(all.map(i => i.time_of_day)),
    composition: uniq(all.flatMap(i => i.composition || [])),
    work: uniq(all.map(i => i.work)),
  }

  return { images, options, total: all.length }
}

export function getImageDetail(id: string): ImageMeta | null {
  const all = loadAllImages()
  return all.find(img => img.id === id) || null
}

export function clearCache() {
  cache = null
}
