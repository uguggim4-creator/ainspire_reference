'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface SelectionToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onDownloadSelected: () => void
  downloading: boolean
}

export default function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onDownloadSelected,
  downloading,
}: SelectionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 h-12 bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl backdrop-blur-sm">
            <span className="text-sm text-white font-medium">
              {selectedCount}장 선택됨
            </span>

            <div className="w-px h-4 bg-[#2a2a2a]" />

            <button
              onClick={onDownloadSelected}
              disabled={downloading}
              className="flex items-center gap-1.5 text-sm text-white hover:text-[#ccc] transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Download size={13} />
              )}
              ZIP 다운로드
            </button>

            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-xs text-[#666] hover:text-[#999] transition-colors"
            >
              <X size={12} />
              선택 해제
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
