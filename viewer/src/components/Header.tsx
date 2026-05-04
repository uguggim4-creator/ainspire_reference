'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Palette, BookmarkIcon } from 'lucide-react'

interface HeaderProps {
  total: number
  filtered: number
  onColorSearch: (hex: string | null) => void
  colorFilter: string | null
  onCollectionToggle: () => void
  showCollection: boolean
  isEditorMode: boolean
  onEditorModeChange: (value: boolean) => void
}

export default function Header({
  total,
  filtered,
  onColorSearch,
  colorFilter,
  onCollectionToggle,
  showCollection,
  isEditorMode,
  onEditorModeChange,
}: HeaderProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [inputHex, setInputHex] = useState('#ffffff')
  const [pwDialogOpen, setPwDialogOpen] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  function handleColorApply() {
    onColorSearch(inputHex)
    setColorPickerOpen(false)
  }

  function handleColorClear() {
    onColorSearch(null)
    setColorPickerOpen(false)
  }

  function handleTitleDoubleClick() {
    if (isEditorMode) {
      onEditorModeChange(false)
      sessionStorage.removeItem('editor_mode')
      return
    }
    setPwInput('')
    setPwError(false)
    setPwDialogOpen(true)
  }

  function handlePwSubmit() {
    if (pwInput === '00973') {
      onEditorModeChange(true)
      sessionStorage.setItem('editor_mode', '1')
      setPwDialogOpen(false)
    } else {
      setPwError(true)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#1a1a1a]">
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-4">
          <span
            className={`text-xs font-medium tracking-[0.2em] uppercase cursor-default select-none ${isEditorMode ? 'text-amber-400' : 'text-white'}`}
            onDoubleClick={handleTitleDoubleClick}
            title={isEditorMode ? 'Editor mode — double-click to exit' : ''}
          >
            AINSPIRE REF{isEditorMode && ' ✎'}
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

      {pwDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setPwDialogOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#0e0e0e] border border-[#222] rounded-xl p-6 w-72 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs text-[#666] mb-4 text-center tracking-widest uppercase">Editor Mode</p>
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handlePwSubmit() }}
              placeholder="Password"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#444] mb-1"
              autoFocus
            />
            {pwError && <p className="text-[10px] text-red-500 mb-2">Wrong password</p>}
            {!pwError && <div className="mb-2" />}
            <div className="flex gap-2">
              <button
                onClick={() => setPwDialogOpen(false)}
                className="flex-1 h-8 border border-[#2a2a2a] text-[#666] text-xs rounded-lg hover:border-[#444] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePwSubmit}
                className="flex-1 h-8 bg-white text-black text-xs rounded-lg font-medium hover:bg-[#eee] transition-colors"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
