'use client'

import { memo, useRef, useEffect, useState } from 'react'
import { ImageMeta } from '@/types'

interface ImageCardProps {
  image: ImageMeta
  selected: boolean
  bookmarked: boolean
  onSelect: (id: string) => void
  onOpen: (image: ImageMeta) => void
  onBookmark: (id: string) => void
}

function ImageCard({
  image,
  selected,
  bookmarked,
  onSelect,
  onOpen,
  onBookmark,
}: ImageCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-open]')) return
    onOpen(image)
  }

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer group"
      style={{ aspectRatio: '16/9' }}
      onClick={handleClick}
    >
      <div className="w-full h-full overflow-hidden rounded-sm bg-[#0a0a0a] transition-transform duration-200 ease-out group-hover:scale-[1.02]">
        {isVisible ? (
          <>
            <img
              src={`/api/thumb/${encodeURIComponent(image.work)}/${image.filename}`}
              alt={image.description}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
              <div className="flex flex-wrap gap-1 mb-1.5">
                {[image.shot_size, image.angle, image.people_count].filter(Boolean).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-sm text-white text-[9px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {image.palette_hex?.length > 0 && (
                <div className="flex gap-0.5 mb-1.5">
                  {image.palette_hex.slice(0, 5).map((hex, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-sm flex-1"
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              )}

              <p className="text-[#ccc] text-[9px] leading-tight truncate">
                {image.description}
              </p>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-[#0a0a0a]" />
        )}
      </div>

      <div
        data-no-open=""
        className={`absolute top-2 left-2 transition-opacity ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={e => { e.stopPropagation(); onSelect(image.id) }}
      >
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            selected
              ? 'bg-white border-white'
              : 'bg-black/40 border-white/50 backdrop-blur-sm'
          }`}
        >
          {selected && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 4L3 6L7 2" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>

      <div
        data-no-open=""
        className="absolute top-2 right-2 flex items-center gap-1"
      >
        <button
          onClick={e => { e.stopPropagation(); onBookmark(image.id) }}
          className={`opacity-0 group-hover:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded bg-black/40 backdrop-blur-sm ${
            bookmarked ? '!opacity-100 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2">
            <path d="M2 1h6v9L5 7.5 2 9V1z" />
          </svg>
        </button>

        {image.reference_score >= 1 && (
          <div className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[#999] text-[9px] font-medium">
            {image.reference_score}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(ImageCard, (prev, next) =>
  prev.image.id === next.image.id &&
  prev.selected === next.selected &&
  prev.bookmarked === next.bookmarked
)
