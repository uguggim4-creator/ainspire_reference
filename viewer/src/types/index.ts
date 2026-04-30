export interface ImageMeta {
  is_scene: boolean
  is_keyart: boolean
  reference_score: number
  angle: string
  shot_size: string
  people_count: string
  composition: string[]
  color_mood: string
  saturation: string
  palette_hex: string[]
  mood: string[]
  setting: string
  location_type: string
  lighting: string
  time_of_day: string
  description: string
  filename: string
  work: string
  imagePath: string
  id: string
}

export interface FilterState {
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
  palette_hex: string | null
  min_score: number
}

export interface Collection {
  id: string
  name: string
  imageIds: string[]
  createdAt: number
}
