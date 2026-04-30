'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Palette, BookmarkIcon, X } from 'lucide-react'

interface HeaderProps {
  total: number
  filtered: number
  onColorSearch: (hex: string | null) => void
  colorFilter: string | null
  onCollectionToggle: () => void
  showCollection: boolean
}

export default function Header({
  total,
  filtered,
  onColorSearch,
  colorFilter,
  onCollectionToggle,
  showCollection,
}: HeaderProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [inputHex, setInputHex] = useState('#ffffff')

  function handleColorApply() {
    onColorSearch(inputHex)
    setColorPickerOpen(false)
  }

  function handleColorClear() {
    onColorSearch(null)
    setColorPickerOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#1a1a1a]">
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium tracking-[0.2em] text-white uppercase">
            Reference Library
          </span>
          <span className="text-xs text-[#666]">
            {filtered === total ? total : `${filtered} / ${total}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="text-xs text-[#555] hover:text-[#888] transition-colors hidden sm:block"
          >
            About
          </Link>
          <Link
            href="/dmca"
            className="text-xs text-[#555] hover:text-[#888] transition-colors hidden sm:block"
          >
            DMCA
          </Link>
          <div className="relative">
            <button
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className={`flex items-center gap-1.5 text-xs px-3 h-7 rounded-full border transition-all ${
                colorFilter
                  ? 'border-white text-white'
                  : 'border-[#333] text-[#666] hover:border-[#555] hover:text-[#999]'
              }`}
            >
              {colorFilter ? (
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: colorFilter }}
                />
              ) : (
                <Palette size={12} />
              )}
              <span>Color</span>
            </button>

            {colorPickerOpen && (
              <div className="absolute top-10 right-0 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 w-52 shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="color"
                    value={inputHex}
                    onChange={e => setInputHex(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={inputHex}
                    onChange={e => setInputHex(e.target.value)}
                    className="flex-1 bg-[#111] border border-[#222] rounded-lg px-2 py-1 text-xs text-white font-mono"
                    maxLength={7}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleColorApply}
                    className="flex-1 h-7 bg-white text-black text-xs rounded-lg font-medium hover:bg-[#eee] transition-colors"
                  >
                    Apply
                  </button>
                  {colorFilter && (
                    <button
                      onClick={handleColorClear}
                      className="h-7 px-3 border border-[#333] text-[#999] text-xs rounded-lg hover:border-[#555] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onCollectionToggle}
            className={`flex items-center gap-1.5 text-xs px-3 h-7 rounded-full border transition-all ${
              showCollection
                ? 'border-white text-white bg-white/10'
                : 'border-[#333] text-[#666] hover:border-[#555] hover:text-[#999]'
            }`}
          >
            <BookmarkIcon size={12} />
            <span>Collections</span>
          </button>
        </div>
      </div>
    </header>
  )
}
