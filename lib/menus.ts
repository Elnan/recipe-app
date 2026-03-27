import { supabase } from './supabase'
import type { Menu, MenuWithRecipes, NewMenu } from '../types/recipe'

export async function getMenus(): Promise<MenuWithRecipes[]> {
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select('*')
    .order('created_at', { ascending: false })

  if (menusError) throw menusError

  if (!menus || menus.length === 0) return []

  const menuIds = menus.map((m) => m.id)

  const { data: menuRecipes, error: mrError } = await supabase
    .from('menu_recipes')
    .select('menu_id, position, recipes(*)')
    .in('menu_id', menuIds)
    .order('position', { ascending: true })

  if (mrError) throw mrError

  return menus.map((menu) => {
    const rows = (menuRecipes ?? []).filter((r) => r.menu_id === menu.id)
    const recipes = rows.map((r) => r.recipes as unknown as import('../types/recipe').Recipe)
    return { ...(menu as Menu), recipes }
  })
}

export async function getMenu(id: string): Promise<MenuWithRecipes> {
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single()

  if (menuError) throw menuError
  if (!menu) throw new Error(`Menu not found: ${id}`)

  const { data: menuRecipes, error: mrError } = await supabase
    .from('menu_recipes')
    .select('position, recipes(*)')
    .eq('menu_id', id)
    .order('position', { ascending: true })

  if (mrError) throw mrError

  const recipes = (menuRecipes ?? []).map(
    (r) => r.recipes as unknown as import('../types/recipe').Recipe
  )

  return { ...(menu as Menu), recipes }
}

export async function createMenu(data: NewMenu): Promise<Menu> {
  const { data: menu, error } = await supabase
    .from('menus')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return menu as Menu
}

export async function updateMenu(id: string, data: Partial<NewMenu>): Promise<Menu> {
  const { data: menu, error } = await supabase
    .from('menus')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return menu as Menu
}

export async function deleteMenu(id: string): Promise<void> {
  const { error } = await supabase.from('menus').delete().eq('id', id)
  if (error) throw error
}

// Sets is_active=true for this menu and false for all others
export async function setMenuActive(id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('menus')
    .update({ is_active: false })
    .neq('id', id)

  if (clearError) throw clearError

  const { error } = await supabase
    .from('menus')
    .update({ is_active: true })
    .eq('id', id)

  if (error) throw error
}

// Replaces all menu_recipes rows for this menu.
// recipeIds is ordered: index 0 → position 1, etc.
export async function setMenuRecipes(menuId: string, recipeIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('menu_recipes')
    .delete()
    .eq('menu_id', menuId)

  if (deleteError) throw deleteError

  if (recipeIds.length === 0) return

  const rows = recipeIds.map((recipeId, i) => ({
    menu_id:   menuId,
    recipe_id: recipeId,
    position:  i + 1,
  }))

  const { error } = await supabase.from('menu_recipes').insert(rows)
  if (error) throw error
}
