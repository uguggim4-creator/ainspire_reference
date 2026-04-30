import { Collection } from '@/types'

const STORAGE_KEY = 'rl_collections'

export function getCollections(): Collection[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCollections(collections: Collection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
}

export function createCollection(name: string): Collection {
  const col: Collection = {
    id: `col_${Date.now()}`,
    name,
    imageIds: [],
    createdAt: Date.now(),
  }
  const cols = getCollections()
  cols.push(col)
  saveCollections(cols)
  return col
}

export function deleteCollection(id: string) {
  const cols = getCollections().filter(c => c.id !== id)
  saveCollections(cols)
}

export function toggleImageInCollection(collectionId: string, imageId: string): boolean {
  const cols = getCollections()
  const col = cols.find(c => c.id === collectionId)
  if (!col) return false
  const idx = col.imageIds.indexOf(imageId)
  if (idx === -1) {
    col.imageIds.push(imageId)
  } else {
    col.imageIds.splice(idx, 1)
  }
  saveCollections(cols)
  return idx === -1
}

export function isInAnyCollection(imageId: string): boolean {
  return getCollections().some(c => c.imageIds.includes(imageId))
}
