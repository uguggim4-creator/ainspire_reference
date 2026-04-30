import { ImageMeta, FilterState } from '@/types'
import { FilterOptions } from '@/components/FilterBar'
import { paletteContainsColor } from '@/lib/color'

let _allImages: ImageMeta[] = []
let _imageMap: Map<string, ImageMeta> = new Map()
let _filterOptions: FilterOptions | null = null
let _loaded = false
let _loading = false

const CHUNK_SIZE = 100
const API_BASE = '/api/images'

export function isLoaded() { return _loaded }
export function isLoading() { return _loading }
export function getImageById(id: string) { return _imageMap.get(id) }
export function getFilterOptions() { return _filterOptions }
export function getTotal() { return _allImages.length }
export function getAllImages() { return _allImages }

// 점진적 로드: 첫 chunk 즉시 반환 → 나머지 백그라운드
export async function loadStore(
  onFirstChunk: (images: ImageMeta[], options: FilterOptions) => void,
  onProgress: (loaded: number, total: number) => void,
  onComplete: () => void,
) {
  if (_loaded || _loading) return
  _loading = true

  // 1) 옵션 + 첫 페이지 동시 fetch
  const [optRes, firstRes] = await Promise.all([
    fetch('/api/options'),
    fetch(`${API_BASE}?page=1&limit=${CHUNK_SIZE}`),
  ])

  const optData = await optRes.json()
  const firstData = await firstRes.json()

  _filterOptions = optData as FilterOptions
  const totalCount: number = firstData.total

  // 첫 chunk 저장
  for (const img of firstData.images) {
    _allImages.push(img)
    _imageMap.set(img.id, img)
  }

  // 첫 화면 즉시 표시
  onFirstChunk(firstData.images, _filterOptions!)
  onProgress(_allImages.length, totalCount)

  // 2) 나머지 백그라운드 로드
  let page = 2
  while (_allImages.length < totalCount) {
    const res = await fetch(`${API_BASE}?page=${page}&limit=${CHUNK_SIZE}`)
    const data = await res.json()
    if (!data.images || data.images.length === 0) break

    for (const img of data.images) {
      _allImages.push(img)
      _imageMap.set(img.id, img)
    }

    onProgress(_allImages.length, totalCount)
    page++
  }

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
