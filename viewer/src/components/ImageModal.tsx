'use client'

import { useEffect, useState } from 'react'
import { ImageMeta } from '@/types'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'

interface ImageModalProps {
  image: ImageMeta
  images: ImageMeta[]
  onClose: () => void
  onNavigate: (image: ImageMeta) => void
}

export default function ImageModal({ image, images, onClose, onNavigate }: ImageModalProps) {
  const currentIndex = images.findIndex(i => i.id === image.id)
  const [detail, setDetail] = useState<ImageMeta | null>(null)

  useEffect(() => {
    setDetail(null)
    fetch(`/api/detail/${encodeURIComponent(image.work)}/${image.filename}`)
      .then(r => r.json())
      .then(setDetail)
      .catch(() => setDetail(null))
  }, [image.id, image.work, image.filename])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1])
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNavigate, currentIndex, images])

  async function handleDownload() {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [image.imagePath || image.id] }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = image.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const d = detail || image

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full h-full max-w-7xl max-h-[92vh] mx-4 my-4 overflow-hidden rounded-lg bg-[#080808] border border-[#1a1a1a]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 flex items-center justify-center bg-black relative min-w-0">
          <img
            src={`/api/image/${encodeURIComponent(image.work)}/${image.filename}`}
            alt={d.description || ''}
            className="max-w-full max-h-full object-contain"
          />

          {currentIndex > 0 && (
            <button
              onClick={() => onNavigate(images[currentIndex - 1])}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => onNavigate(images[currentIndex + 1])}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#555] text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        <div className="w-72 shrink-0 flex flex-col border-l border-[#1a1a1a] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <span className="text-xs font-medium text-white truncate">{image.work}</span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-[#555] hover:text-white transition-colors ml-2"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {d.description && (
              <p className="text-xs text-[#888] leading-relaxed">{d.description}</p>
            )}

            {d.palette_hex?.length > 0 && (
              <div>
                <div className="text-[10px] text-[#444] uppercase tracking-widest mb-2">Palette</div>
                <div className="space-y-1.5">
                  {d.palette_hex.map((hex: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded-sm shrink-0" style={{ background: hex }} />
                      <span className="text-[10px] text-[#666] font-mono tracking-wider">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-[#444] uppercase tracking-widest mb-2">Mood</div>
              <div className="flex flex-wrap gap-1">
                {(d.mood || []).map((m: string) => (
                  <span key={m} className="px-2 py-0.5 rounded-full border border-[#2a2a2a] text-[#888] text-[10px]">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {(d.composition || []).length > 0 && (
              <div>
                <div className="text-[10px] text-[#444] uppercase tracking-widest mb-2">Composition</div>
                <div className="flex flex-wrap gap-1">
                  {d.composition.map((c: string) => (
                    <span key={c} className="px-2 py-0.5 rounded-full border border-[#2a2a2a] text-[#888] text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {[
                ['Angle', d.angle],
                ['Shot Size', d.shot_size],
                ['People', d.people_count],
                ['Color Mood', d.color_mood],
                ['Saturation', d.saturation],
                ['Setting', d.setting],
                ['Location', d.location_type],
                ['Lighting', d.lighting],
                ['Time of Day', d.time_of_day],
                ['Score', String(d.reference_score)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-[10px] text-[#444] shrink-0">{label}</span>
                  <span className="text-[10px] text-[#888] text-right">{val || '-'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#1a1a1a]">
            <button
              onClick={handleDownload}
              className="w-full h-9 bg-white text-black text-xs font-medium rounded-lg hover:bg-[#eee] transition-colors flex items-center justify-center gap-2"
            >
              <Download size={13} />
              Download JPG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
