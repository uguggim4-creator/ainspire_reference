'use client'

import { useEffect } from 'react'
import { ImageMeta } from '@/types'
import { FilterOptions } from '@/components/FilterBar'
import { ChevronLeft, ChevronRight, X, Download, Trash2 } from 'lucide-react'

interface ImageModalProps {
  image: ImageMeta
  images: ImageMeta[]
  filterOptions: FilterOptions | null
  onClose: () => void
  onNavigate: (image: ImageMeta) => void
  onTagEdit: (imageId: string, field: string, value: string | string[]) => void
  isEditorMode?: boolean
  onDelete?: (imageId: string) => void
}

function TagSelect({
  label, field, value, options, onEdit,
}: {
  label: string
  field: string
  value: string
  options: string[]
  onEdit: (field: string, value: string) => void
}) {
  return (
    <div className="flex justify-between gap-2 items-center">
      <span className="text-[10px] text-[#444] shrink-0">{label}</span>
      <select
        value={value || ''}
        onChange={(e) => onEdit(field, e.target.value)}
        className="text-[10px] text-[#888] bg-transparent border border-[#2a2a2a] rounded px-1 py-0.5 text-right max-w-[140px] cursor-pointer hover:border-[#444] transition-colors appearance-none"
      >
        <option value="">-</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

function TagMultiSelect({
  label, field, values, options, onEdit,
}: {
  label: string
  field: string
  values: string[]
  options: string[]
  onEdit: (field: string, value: string[]) => void
}) {
  function toggle(opt: string) {
    const next = values.includes(opt)
      ? values.filter(v => v !== opt)
      : [...values, opt]
    onEdit(field, next)
  }

  return (
    <div>
      <div className="text-[10px] text-[#444] uppercase tracking-widest mb-2">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors cursor-pointer ${
              values.includes(opt)
                ? 'border-white/40 text-white bg-white/10'
                : 'border-[#2a2a2a] text-[#555] hover:border-[#444] hover:text-[#888]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ImageModal({ image, images, filterOptions, onClose, onNavigate, onTagEdit, isEditorMode, onDelete }: ImageModalProps) {
  const currentIndex = images.findIndex(i => i.id === image.id)
  const d = image
  const opts = filterOptions

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1])
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNavigate, currentIndex, images])

  function handleEdit(field: string, value: string | string[]) {
    onTagEdit(image.id, field, value)
  }

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
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ainspire/thumbs/${image.work_key}/${image.filename}`}
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

            {opts && (
              <TagMultiSelect
                label="Mood"
                field="mood"
                values={d.mood || []}
                options={opts.mood}
                onEdit={handleEdit}
              />
            )}

            {opts && (
              <TagMultiSelect
                label="Composition"
                field="composition"
                values={d.composition || []}
                options={opts.composition}
                onEdit={handleEdit}
              />
            )}

            {opts && (
              <div className="space-y-2">
                <TagSelect label="Angle" field="angle" value={d.angle} options={opts.angle} onEdit={handleEdit} />
                <TagSelect label="Shot Size" field="shot_size" value={d.shot_size} options={opts.shot_size} onEdit={handleEdit} />
                <TagSelect label="People" field="people_count" value={d.people_count} options={opts.people_count} onEdit={handleEdit} />
                <TagSelect label="Color Mood" field="color_mood" value={d.color_mood} options={opts.color_mood} onEdit={handleEdit} />
                <TagSelect label="Saturation" field="saturation" value={d.saturation} options={opts.saturation} onEdit={handleEdit} />
                <TagSelect label="Setting" field="setting" value={d.setting} options={opts.setting} onEdit={handleEdit} />
                <TagSelect label="Location" field="location_type" value={d.location_type} options={opts.location_type} onEdit={handleEdit} />
                <TagSelect label="Lighting" field="lighting" value={d.lighting} options={opts.lighting} onEdit={handleEdit} />
                <TagSelect label="Time of Day" field="time_of_day" value={d.time_of_day} options={opts.time_of_day} onEdit={handleEdit} />
                <div className="flex justify-between gap-2">
                  <span className="text-[10px] text-[#444] shrink-0">Score</span>
                  <span className="text-[10px] text-[#888] text-right">{d.reference_score}</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-[#1a1a1a] space-y-2">
            <button
              onClick={async () => {
                const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ainspire/originals/${image.work_key}/${image.filename}`
                const res = await fetch(url)
                const blob = await res.blob()
                const blobUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = image.filename
                a.click()
                URL.revokeObjectURL(blobUrl)
              }}
              className="w-full h-9 bg-white text-black text-xs font-medium rounded-lg hover:bg-[#eee] transition-colors flex items-center justify-center gap-2"
            >
              <Download size={13} />
              Download JPG
            </button>
            {isEditorMode && onDelete && (
              <button
                onClick={() => onDelete(image.id)}
                className="w-full h-9 border border-red-900 text-red-500 text-xs font-medium rounded-lg hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
