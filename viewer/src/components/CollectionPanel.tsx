'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X } from 'lucide-react'
import { Collection, ImageMeta } from '@/types'
import {
  getCollections,
  createCollection,
  deleteCollection,
  toggleImageInCollection,
  saveCollections,
} from '@/lib/collections'

interface CollectionPanelProps {
  images: ImageMeta[]
  bookmarkedIds: Set<string>
  onClose: () => void
  onBookmarkChange: (ids: Set<string>) => void
}

export default function CollectionPanel({
  images,
  bookmarkedIds,
  onClose,
  onBookmarkChange,
}: CollectionPanelProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)

  useEffect(() => {
    setCollections(getCollections())
  }, [])

  function refresh() {
    const cols = getCollections()
    setCollections(cols)
    const allIds = new Set(cols.flatMap(c => c.imageIds))
    onBookmarkChange(allIds)
  }

  function handleCreate() {
    if (!newName.trim()) return
    createCollection(newName.trim())
    setNewName('')
    setCreating(false)
    refresh()
  }

  function handleDelete(id: string) {
    deleteCollection(id)
    if (activeCollectionId === id) setActiveCollectionId(null)
    refresh()
  }

  function handleToggleImage(collectionId: string, imageId: string) {
    toggleImageInCollection(collectionId, imageId)
    refresh()
  }

  const activeCollection = collections.find(c => c.id === activeCollectionId)
  const activeImages = activeCollection
    ? images.filter(img => activeCollection.imageIds.includes(img.id))
    : []

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed top-0 right-0 bottom-0 w-80 bg-[#080808] border-l border-[#1a1a1a] z-40 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#1a1a1a]">
        <span className="text-xs font-medium tracking-widest uppercase text-white">Collections</span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#555] hover:text-white">
          <X size={14} />
        </button>
      </div>

      {!activeCollectionId ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1 mb-4">
            {collections.map(col => (
              <div
                key={col.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#111] cursor-pointer group"
                onClick={() => setActiveCollectionId(col.id)}
              >
                <div>
                  <div className="text-sm text-white">{col.name}</div>
                  <div className="text-[11px] text-[#555]">{col.imageIds.length}장</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(col.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {collections.length === 0 && !creating && (
              <p className="text-[#444] text-xs py-6 text-center">
                컬렉션이 없습니다
              </p>
            )}
          </div>

          {creating ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
                placeholder="컬렉션 이름"
                autoFocus
                className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 h-8 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#444]"
              />
              <button onClick={handleCreate} className="h-8 px-3 bg-white text-black text-xs rounded-lg font-medium">
                추가
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#555] hover:text-[#999] border border-dashed border-[#1a1a1a] hover:border-[#333] rounded-lg transition-all"
            >
              <Plus size={12} />
              새 컬렉션
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
            <button
              onClick={() => setActiveCollectionId(null)}
              className="text-[#555] hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-xs text-white">{activeCollection?.name}</span>
            <span className="text-[11px] text-[#555] ml-auto">{activeCollection?.imageIds.length}장</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {activeImages.length === 0 ? (
              <p className="text-[#444] text-xs py-6 text-center">이미지를 추가해주세요</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {activeImages.map(img => (
                  <div key={img.id} className="relative group rounded-sm overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={`/api/image/${encodeURIComponent(img.work)}/${img.filename}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleToggleImage(activeCollectionId, img.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 bg-black/70 rounded flex items-center justify-center text-[#999] hover:text-red-400 transition-all"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
