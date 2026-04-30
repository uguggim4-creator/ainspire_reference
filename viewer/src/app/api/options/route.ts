import { NextResponse } from 'next/server'
import { loadAllImages } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const images = loadAllImages()

  const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean).sort()

  const options = {
    angle: uniq(images.map(i => i.angle)),
    shot_size: uniq(images.map(i => i.shot_size)),
    people_count: uniq(images.map(i => i.people_count)),
    color_mood: uniq(images.map(i => i.color_mood)),
    saturation: uniq(images.map(i => i.saturation)),
    mood: uniq(images.flatMap(i => i.mood || [])),
    setting: uniq(images.map(i => i.setting)),
    location_type: uniq(images.map(i => i.location_type)),
    lighting: uniq(images.map(i => i.lighting)),
    time_of_day: uniq(images.map(i => i.time_of_day)),
    composition: uniq(images.flatMap(i => i.composition || [])),
    work: uniq(images.map(i => i.work)),
    total: images.length,
  }

  return NextResponse.json(options)
}
