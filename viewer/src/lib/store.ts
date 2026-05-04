import { ImageMeta, FilterState } from '@/types'
import { FilterOptions } from '@/components/FilterBar'
import { paletteContainsColor } from '@/lib/color'

let _allImages: ImageMeta[] = []
let _imageMap: Map<string, ImageMeta> = new Map()
let _filterOptions: FilterOptions | null = null
let _loaded = false
let _loading = false

export function isLoaded() { return _loaded }
export function isLoading() { return _loading }
export function getImageById(id: string) { return _imageMap.get(id) }
export function getFilterOptions() { return _filterOptions }
export function getTotal() { return _allImages.length }
export function getAllImages() { return _allImages }

// index.json에서 직접 로드 (API 라우트 불필요)
export async function loadStore(
  onFirstChunk: (images: ImageMeta[], options: FilterOptions) => void,
  onProgress: (loaded: number, total: number) => void,
  onComplete: () => void,
) {
  if (_loaded || _loading) return
  _loading = true

  const res = await fetch('/index.json')
  const data = await res.json()

  const images: ImageMeta[] = data.images
  const options: FilterOptions = data.options

  _filterOptions = options

  for (const img of images) {
    _allImages.push(img)
    _imageMap.set(img.id, img)
  }

  onFirstChunk(images, options)
  onProgress(images.length, images.length)

  _loaded = true
  _loading = false
  onComplete()
}

export function filterImages(filters: FilterState): string[] {
  const ids: string[] = []
  for (let i = 0; i < _allImages.length; i++) {
    const img = _allImages[i]
    if (filters.angle.length && !filters.angle.includes(img.angle)) continue
    if (filters.shot_size.length && !filters.shot_size.includes(img.shot_size)) continue
    if (filters.people_count.length && !filters.people_count.includes(img.people_count)) continue
    if (filters.color_mood.length && !filters.color_mood.includes(img.color_mood)) continue
    if (filters.saturation.length && !filters.saturation.includes(img.saturation)) continue
    if (filters.setting?.length && !filters.setting.includes(img.setting)) continue
    if (filters.location_type?.length && !filters.location_type.includes(img.location_type)) continue
    if (filters.lighting?.length && !filters.lighting.includes(img.lighting)) continue
    if (filters.time_of_day?.length && !filters.time_of_day.includes(img.time_of_day)) continue
    if (filters.work.length && !filters.work.includes(img.work)) continue
    if (filters.mood.length && !filters.mood.some(m => img.mood?.includes(m))) continue
    if (filters.composition.length && !filters.composition.some(c => img.composition?.includes(c))) continue
    if (filters.min_score > 0 && img.reference_score < filters.min_score) continue
    if (filters.palette_hex && !paletteContainsColor(img.palette_hex, filters.palette_hex)) continue
    ids.push(img.id)
  }
  return ids
}
