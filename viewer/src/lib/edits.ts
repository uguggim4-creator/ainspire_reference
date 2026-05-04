import { supabase } from './supabase'
import { ImageMeta } from '@/types'

export async function fetchAllEdits(): Promise<Map<string, Partial<ImageMeta>>> {
  const { data } = await supabase.from('image_edits').select('image_id, edits')
  const map = new Map<string, Partial<ImageMeta>>()
  if (data) {
    for (const row of data) {
      map.set(row.image_id, row.edits as Partial<ImageMeta>)
    }
  }
  return map
}

export async function saveEdit(imageId: string, field: string, value: string | string[] | boolean) {
  const { data: existing } = await supabase
    .from('image_edits')
    .select('edits')
    .eq('image_id', imageId)
    .single()

  const merged = { ...(existing?.edits || {}), [field]: value }

  await supabase.from('image_edits').upsert({
    image_id: imageId,
    edits: merged,
    updated_at: new Date().toISOString(),
  })
}
