import { supabase } from './supabase'
import type { Recipe, RecipeCategory, NewRecipe } from '../types/recipe'

export interface RecipeFilters {
  category?: RecipeCategory
  cooking_method?: string
  dietary?: string[]
  min_rating?: number
  max_time_minutes?: number
}

export async function getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  let query = supabase.from('recipes').select('*')

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.cooking_method) {
    query = query.eq('cooking_method', filters.cooking_method)
  }
  if (filters?.min_rating != null) {
    query = query.gte('rating', filters.min_rating)
  }
  if (filters?.dietary && filters.dietary.length > 0) {
    query = query.overlaps('dietary', filters.dietary)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  let recipes = (data ?? []) as Recipe[]

  // max_time_minutes is a computed value (prep + cook) — filtered client-side
  if (filters?.max_time_minutes != null) {
    recipes = recipes.filter(r => {
      const total = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0)
      return total <= filters.max_time_minutes!
    })
  }

  return recipes
}

export async function getRecipeBySourceUrl(sourceUrl: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('source_url', sourceUrl)
    .maybeSingle()

  if (error) return null
  return data as Recipe | null
}

export async function saveRecipe(recipe: NewRecipe): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single()

  if (error) throw error
  return data as Recipe
}

export async function updateRecipe(id: string, data: Partial<NewRecipe>): Promise<Recipe> {
  const { data: updated, error } = await supabase
    .from('recipes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as Recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error(`Recipe not found: ${id}`)

  return data as Recipe
}
