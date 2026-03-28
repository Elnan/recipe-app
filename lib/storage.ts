import { supabase } from './supabase'

export async function uploadRecipeImage(
  file: File,
  recipeId: string,
): Promise<string> {
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `recipes/${recipeId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteRecipeImage(url: string): Promise<void> {
  const marker = '/recipe-images/'
  const idx    = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from('recipe-images').remove([path])
}
