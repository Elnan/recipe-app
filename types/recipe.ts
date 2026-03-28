// Canonical Recipe type — never change without discussion (see CLAUDE.md)
import type { RecipeIconKey } from '../lib/recipe-icons'

export type RecipeCategory = 'dinner' | 'breakfast' | 'baking' | 'dessert' | 'other'

export interface Ingredient {
  name: string
  amount: number           // always a decimal (e.g. 0.5, 1.0, 2.5)
  unit: string             // stored separately from amount (e.g. "cup", "g", "tbsp")
  notes?: string           // e.g. "finely chopped", "at room temperature"
  step_reference?: string  // which step this ingredient is used in
}

export interface RecipeStep {
  order: number
  instruction: string
  ingredients_used: string[]  // ingredient names referenced in this step
}

export interface Recipe {
  id: string
  title: string
  description?: string
  source_url?: string      // original URL if imported
  image_url?: string
  image_icon?: RecipeIconKey

  servings: number         // base serving count — scaling is client-side only
  prep_time_minutes?: number
  cook_time_minutes?: number

  category: RecipeCategory
  rating?: number          // 1–5
  menu_name?: string

  cuisine?: string
  cooking_method?: string
  protein_type?: 'kjott' | 'kylling' | 'fisk' | 'vegetar'
  dietary?: string[]       // e.g. ["vegetarian", "gluten-free"]
  tags?: string[]

  ingredients: Ingredient[]
  steps: RecipeStep[]

  created_at: string       // ISO 8601
  updated_at: string       // ISO 8601
}

// Omit DB-managed fields when creating a new recipe
export type NewRecipe = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>

export interface Menu {
  id: string
  created_at: string
  updated_at: string
  name: string
  week_number?: number
  year?: number
  is_active: boolean
  dominant_protein?: 'kjott' | 'kylling' | 'fisk' | 'vegetar'
}

export interface MenuWithRecipes extends Menu {
  recipes: Recipe[]
}

export type NewMenu = Omit<Menu, 'id' | 'created_at' | 'updated_at'>
