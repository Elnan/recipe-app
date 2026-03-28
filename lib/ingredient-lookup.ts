import { supabase } from './supabase'
import { getPackageSize } from './kassal'
import type { Recipe } from '../types/recipe'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function lookupRecipeIngredients(recipeId: string): Promise<void> {
  // Fetch the recipe
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single()

  if (error || !data) {
    console.error('[ingredient-lookup] Recipe not found:', recipeId, error?.message)
    return
  }

  const recipe = data as Recipe

  // Deduplicate ingredient names
  const uniqueNames = [...new Set(recipe.ingredients.map(i => i.name.toLowerCase().trim()))]

  // Check which have already been attempted
  const { data: existing } = await supabase
    .from('ingredient_products')
    .select('ingredient_name')
    .in('ingredient_name', uniqueNames)
    .eq('lookup_attempted', true)

  const alreadyDone = new Set((existing ?? []).map(r => r.ingredient_name as string))
  const toLookup = uniqueNames.filter(name => !alreadyDone.has(name))

  if (toLookup.length === 0) return

  // Sequential lookups with 500ms delay to respect Kassal rate limit (60/min)
  for (let i = 0; i < toLookup.length; i++) {
    const name = toLookup[i]
    try {
      await getPackageSize(name, recipe.source_url ?? undefined)
    } catch (err) {
      console.error(`[ingredient-lookup] Failed for "${name}":`, err)
    }
    if (i < toLookup.length - 1) {
      await sleep(500)
    }
  }
}
