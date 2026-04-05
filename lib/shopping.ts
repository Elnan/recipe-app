import { supabase } from './supabase'
import type { StoreSection } from './store-sections'
import { getIngredientPreset } from './store-sections'
import { normaliseIngredientName } from './ingredient-normaliser'
import { isPantryStaple } from '../src/lib/recipe-meta'
import type { Recipe, MenuWithRecipes } from '../types/recipe'

export interface ShoppingListItem {
  id:               string
  created_at:       string
  name:             string
  amount:           number | null
  unit:             string | null
  store_section:    StoreSection
  notes:            string | null
  source_recipe_id: string | null
  source_menu_id:   string | null
  is_manual:        boolean
  quantity:         number
}

export type NewShoppingListItem = Omit<ShoppingListItem, 'id' | 'created_at' | 'quantity'> & { quantity?: number }

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ShoppingListItem[]
}

export async function addShoppingListItem(item: NewShoppingListItem): Promise<ShoppingListItem> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      ...item,
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    })
    .select()
    .single()

  if (error) throw error
  return data as ShoppingListItem
}

export async function updateShoppingListItem(
  id: string,
  patch: Partial<Pick<ShoppingListItem, 'amount' | 'unit' | 'notes' | 'store_section' | 'quantity'>>,
): Promise<ShoppingListItem> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ShoppingListItem
}

export async function removeShoppingListItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function removeBySource(
  field: 'source_recipe_id' | 'source_menu_id',
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq(field, id)

  if (error) throw error
}

async function mergeIngredients(
  ingredients: Array<NewShoppingListItem>,
): Promise<void> {
  const existing = await getShoppingListItems()

  for (const ing of ingredients) {
    const match = existing.find(
      e =>
        normaliseIngredientName(e.name) === normaliseIngredientName(ing.name) &&
        (e.unit ?? '') === (ing.unit ?? ''),
    )
    if (match) {
      await updateShoppingListItem(match.id, {
        amount: (match.amount ?? 0) + (ing.amount ?? 0),
      })
    } else {
      await addShoppingListItem(ing)
    }
  }
}

export async function addRecipeToShoppingList(recipe: Recipe): Promise<void> {
  const items: NewShoppingListItem[] = recipe.ingredients
    .filter(ing => !isPantryStaple(ing.name))
    .map(ing => {
    const preset = getIngredientPreset(ing.name)
    return {
      name:             ing.name,
      amount:           ing.amount ?? preset.amount,
      unit:             ing.unit  || preset.unit,
      store_section:    preset.section,
      notes:            ing.notes ?? null,
      source_recipe_id: recipe.id,
      source_menu_id:   null,
      is_manual:        false,
    }
  })

  await mergeIngredients(items)
}

export async function addMenuToShoppingList(menu: MenuWithRecipes): Promise<void> {
  const items: NewShoppingListItem[] = menu.recipes.flatMap(recipe =>
    recipe.ingredients
      .filter(ing => !isPantryStaple(ing.name))
      .map(ing => {
      const preset = getIngredientPreset(ing.name)
      return {
        name:             ing.name,
        amount:           ing.amount ?? preset.amount,
        unit:             ing.unit  || preset.unit,
        store_section:    preset.section,
        notes:            ing.notes ?? null,
        source_recipe_id: recipe.id,
        source_menu_id:   menu.id,
        is_manual:        false,
      }
    })
  )

  await mergeIngredients(items)
}

export async function clearAllItems(): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows

  if (error) throw error
}
