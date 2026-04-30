'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { FilterState, ImageMeta } from '@/types'

interface FilterGroup {
  label: string
  key: keyof Omit<FilterState, 'palette_hex' | 'min_score'>
  values: string[]
}

export interface FilterOptions {
  angle: string[]
  shot_size: string[]
  people_count: string[]
  color_mood: string[]
  saturation: string[]
  mood: string[]
  setting: string[]
  location_type: string[]
  lighting: string[]
  time_of_day: string[]
  composition: string[]
  work: string[]
}

interface FilterBarProps {
  options: FilterOptions | null
  filters: FilterState
  onChange: (filters: FilterState) => void
}

function buildGroups(options: FilterOptions): FilterGroup[] {
  return [
    { label: 'Camera', key: 'angle', values: options.angle },
    { label: 'Shot', key: 'shot_size', values: options.shot_size },
    { label: 'People', key: 'people_count', values: options.people_count },
    { label: 'Color', key: 'color_mood', values: options.color_mood },
    { label: 'Mood', key: 'mood', values: options.mood },
    { label: 'Setting', key: 'setting', values: options.setting },
    { label: 'Location', key: 'location_type', values: options.location_type },
    { label: 'Light', key: 'lighting', values: options.lighting },
    { label: 'Time', key: 'time_of_day', values: options.time_of_day },
    { label: 'Work', key: 'work', values: options.work },
  ]
}

export default function FilterBar({ options, filters, onChange }: FilterBarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  if (!options) return null
  const groups = buildGroups(options)

  const hasActiveFilters =
    Object.entries(filters)
      .filter(([k]) => k !== 'palette_hex' && k !== 'min_score')
      .some(([, v]) => Array.isArray(v) && v.length > 0)

  function toggleTag(key: keyof Omit<FilterState, 'palette_hex' | 'min_score'>, value: string) {
    const current = (filters[key] as string[]) || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  function clearAll() {
    onChange({
      ...filters,
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
    })
    setExpandedGroup(null)
  }

  return (
    <div className="sticky top-12 z-40 bg-black border-b border-[#1a1a1a]">
      <div className="flex items-center gap-0 overflow-x-auto no-scrollbar px-4 h-10">
        {groups.map(group => {
          const activeCount = (filters[group.key] as string[])?.length || 0
          const isExpanded = expandedGroup === group.label

          return (
            <button
              key={group.label}
              onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 h-7 rounded-full text-xs font-medium transition-all mr-1.5 ${
                activeCount > 0
                  ? 'bg-white text-black'
                  : isExpanded
                  ? 'bg-[#1a1a1a] text-white border border-[#333]'
                  : 'text-[#666] hover:text-[#999] border border-transparent hover:border-[#333]'
              }`}
            >
              {group.label}
              {activeCount > 0 && (
                <span className="bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex-shrink-0 flex items-center gap-1 px-3 h-7 text-xs text-[#666] hover:text-white transition-colors ml-auto"
          >
            <X size={11} />
            Clear
          </button>
        )}
      </div>

      {expandedGroup && (
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-[#111] bg-[#050505]">
          {groups
            .find(g => g.label === expandedGroup)
            ?.values.map(value => {
              const key = groups.find(g => g.label === expandedGroup)!.key
              const active = (filters[key] as string[])?.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleTag(key, value)}
                  className={`px-3 h-7 rounded-full text-xs transition-all ${
                    active
                      ? 'bg-white text-black font-medium'
                      : 'bg-transparent border border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-[#ccc]'
                  }`}
                >
                  {value}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
