'use client'

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ImageMeta, FilterState } from '@/types'
import Header from '@/components/Header'
import FilterBar, { FilterOptions } from '@/components/FilterBar'
import GalleryGrid from '@/components/GalleryGrid'
import ImageModal from '@/components/ImageModal'
import SelectionToolbar from '@/components/Toolbar'
import CollectionPanel from '@/components/CollectionPanel'
import { getCollections } from '@/lib/collections'
import { loadStore, filterImages, getImageById, getAllImages } from '@/lib/store'
import { saveEdit } from '@/lib/edits'

const DEFAULT_FILTERS: FilterState = {
  angle: [],
  shot_size: [],
  people_count: [],
  color_mood: [],
  saturation: [],
  mood: [],
  setting: [],
  location_type: [],
  lighting: [],
  time_of_day: [],
  composition: [],
  work: [],
  palette_hex: null,
  min_score: 0,
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filteredIds, setFilteredIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [modalImage, setModalImage] = useState<ImageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showCollection, setShowCollection] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [total, setTotal] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)

  // 점진적 로드
  useEffect(() => {
    loadStore(
      // 첫 chunk 도착 → 즉시 화면 표시
      (images, options) => {
        setFilterOptions(options)
        setFilteredIds(images.map(i => i.id))
        setTotal(images.length)
        setLoading(false)
      },
      // 진행 상황 — 카운터만 갱신, 필터 재적용은 완료 시에만
      (loaded, serverTotal) => {
        setLoadedCount(loaded)
        setTotal(serverTotal)
      },
      // 완료
      () => {
        startTransition(() => {
          setFilteredIds(filterImages(filters))
        })
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const cols = getCollections()
    const allIds = new Set(cols.flatMap((c: { imageIds: string[] }) => c.imageIds))
    setBookmarkedIds(allIds)
  }, [])

  // 필터 변경 → ID만 업데이트
  useEffect(() => {
    if (loading) return
    startTransition(() => {
      setFilteredIds(filterImages(filters))
    })
  }, [filters, loading, startTransition])

  // ID → ImageMeta 조회
  const filteredImages = useMemo(() => {
    const result: ImageMeta[] = []
    for (const id of filteredIds) {
      const img = getImageById(id)
      if (img) result.push(img)
    }
    return result
  }, [filteredIds])

  function handleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBookmark(id: string) {
    import('@/lib/collections').then(({ getCollections, createCollection, toggleImageInCollection }) => {
      let cols = getCollections()
      if (cols.length === 0) {
        createCollection('Default')
        cols = getCollections()
      }
      const col = cols[0]
      toggleImageInCollection(col.id, id)
      const updatedCols = getCollections()
      const allIds = new Set(updatedCols.flatMap((c: { imageIds: string[] }) => c.imageIds))
      setBookmarkedIds(allIds)
    })
  }

  async function handleDownloadSelected() {
    if (selectedIds.size === 0) return
    setDownloading(true)
    try {
      const paths = Array.from(selectedIds)
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'references.zip'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenModal = useCallback((image: ImageMeta) => setModalImage(image), [])
  const handleCloseModal = useCallback(() => setModalImage(null), [])

  const handleTagEdit = useCallback(async (imageId: string, field: string, value: string | string[]) => {
    const img = getImageById(imageId)
    if (img) {
      ;(img as unknown as Record<string, unknown>)[field] = value
      setModalImage({ ...img })
    }
    await saveEdit(imageId, field, value)
  }, [])

  const loadingProgress = total > 0 && loadedCount < total
    ? `${loadedCount} / ${total}`
    : undefined

  return (
    <div className="min-h-screen bg-black">
      <Header
        total={total}
        filtered={filteredIds.length}
        onColorSearch={hex => setFilters(f => ({ ...f, palette_hex: hex }))}
        colorFilter={filters.palette_hex}
        onCollectionToggle={() => setShowCollection(s => !s)}
        showCollection={showCollection}
      />

      <FilterBar
        options={filterOptions}
        filters={filters}
        onChange={setFilters}
      />

      <main className={`pt-0 transition-all ${showCollection ? 'mr-80' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#444] text-sm">
            Loading...
          </div>
        ) : (
          <>
            {loadingProgress && (
              <div className="text-center py-1 text-[#333] text-[10px]">
                Loading images... {loadingProgress}
              </div>
            )}
            <div>
              <GalleryGrid
                images={filteredImages}
                selected={selectedIds}
                bookmarked={bookmarkedIds}
                onSelect={handleSelect}
                onOpen={handleOpenModal}
                onBookmark={handleBookmark}
              />
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showCollection && (
          <CollectionPanel
            images={getAllImages()}
            bookmarkedIds={bookmarkedIds}
            onClose={() => setShowCollection(false)}
            onBookmarkChange={setBookmarkedIds}
          />
        )}
      </AnimatePresence>

      {modalImage && (
        <ImageModal
          image={modalImage}
          images={filteredImages}
          filterOptions={filterOptions}
          onClose={handleCloseModal}
          onNavigate={handleOpenModal}
          onTagEdit={handleTagEdit}
        />
      )}

      <SelectionToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDownloadSelected={handleDownloadSelected}
        downloading={downloading}
      />
    </div>
  )
}
