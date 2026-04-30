'use client'

import { FilterState } from '@/types'

interface FilterOption {
  value: string
  label: string
}

interface FilterSidebarProps {
  filters: FilterState
  options: Record<string, string[]>
  onChange: (filters: FilterState) => void
  onReset: () => void
}

const FILTER_LABELS: Record<string, string> = {
  angle: 'Angle',
  shot_size: 'Shot Size',
  people_count: 'People',
  color_mood: 'Color Mood',
  saturation: 'Saturation',
  mood: 'Mood',
  setting: 'Setting',
  location_type: 'Location',
  lighting: 'Lighting',
  time_of_day: 'Time of Day',
  composition: 'Composition',
  work: 'Work',
}

const ARRAY_FILTERS = new Set(['mood', 'composition'])

export default function FilterSidebar({ filters, options, onChange, onReset }: FilterSidebarProps) {
  function toggle(key: keyof FilterState, value: string) {
    const current = filters[key] as string[]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  function isActive(key: keyof FilterState, value: string): boolean {
    return (filters[key] as string[]).includes(value)
  }

  const filterKeys = Object.keys(FILTER_LABELS) as (keyof FilterState)[]
  const activeCount = filterKeys.reduce((acc, k) => acc + (filters[k] as string[]).length, 0)

  return (
    <aside className="w-64 shrink-0 h-screen overflow-y-auto sticky top-0 bg-[#111] border-r border-[#222] flex flex-col">
      <div className="p-4 border-b border-[#222] flex items-center justify-between">
        <h1 className="text-sm font-semibold text-white tracking-wide uppercase">Filters</h1>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-[#888] hover:text-white transition-colors"
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      <div className="p-3 border-b border-[#222]">
        <label className="text-xs text-[#666] uppercase tracking-wide block mb-2">Min Score</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={10}
            value={filters.min_score}
            onChange={e => onChange({ ...filters, min_score: parseInt(e.target.value) })}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xs text-white w-4 text-right">{filters.min_score}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filterKeys.map(key => {
          const opts = options[key as string] || []
          if (opts.length === 0) return null
          const selected = filters[key] as string[]

          return (
            <div key={key} className="border-b border-[#1a1a1a]">
              <div className="px-3 py-2">
                <span className="text-xs text-[#666] uppercase tracking-wide">
                  {FILTER_LABELS[key as string]}
                  {selected.length > 0 && (
                    <span className="ml-1 text-blue-400">({selected.length})</span>
                  )}
                </span>
              </div>
              <div className="px-3 pb-3 flex flex-wrap gap-1">
                {opts.map(opt => {
                  const active = isActive(key, opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(key, opt)}
                      className={`text-xs px-2 py-1 rounded border transition-colors truncate max-w-full ${
                        active
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#1a1a1a] border-[#333] text-[#aaa] hover:border-[#555] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
