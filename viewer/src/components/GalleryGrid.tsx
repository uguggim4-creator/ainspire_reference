'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ImageMeta } from '@/types'
import ImageCard from './ImageCard'

interface GalleryGridProps {
  images: ImageMeta[]
  selected: Set<string>
  bookmarked: Set<string>
  onSelect: (id: string) => void
  onOpen: (image: ImageMeta) => void
  onBookmark: (id: string) => void
}

const RENDER_BATCH = 40

export default function GalleryGrid({
  images,
  selected,
  bookmarked,
  onSelect,
  onOpen,
  onBookmark,
}: GalleryGridProps) {
  const [renderCount, setRenderCount] = useState(RENDER_BATCH)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // images 변경 시 렌더 카운트 리셋
  useEffect(() => {
    setRenderCount(RENDER_BATCH)
  }, [images])

  // 스크롤 끝 감지 → 더 렌더
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRenderCount(prev => Math.min(prev + RENDER_BATCH, images.length))
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [images.length, renderCount])

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#444] text-sm">
        No images match the current filters.
      </div>
    )
  }

  const visible = images.slice(0, renderCount)

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {visible.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            selected={selected.has(image.id)}
            bookmarked={bookmarked.has(image.id)}
            onSelect={onSelect}
            onOpen={onOpen}
            onBookmark={onBookmark}
          />
        ))}
      </div>

      {renderCount < images.length && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <div className="text-[#333] text-xs">
            {renderCount} / {images.length}
          </div>
        </div>
      )}
    </div>
  )
}
