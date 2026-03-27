import { NextRequest, NextResponse } from 'next/server'
import { getMenus, createMenu, setMenuRecipes, getMenu } from '../../../../lib/menus'
import type { NewMenu } from '../../../../types/recipe'

export async function GET() {
  try {
    const menus = await getMenus()
    return NextResponse.json({ menus })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (!b.name || typeof b.name !== 'string') {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
  }

  const menuData: NewMenu = {
    name:             b.name,
    week_number:      typeof b.week_number === 'number' ? b.week_number : undefined,
    year:             typeof b.year === 'number' ? b.year : undefined,
    is_active:        typeof b.is_active === 'boolean' ? b.is_active : false,
    dominant_protein: isValidProtein(b.dominant_protein) ? b.dominant_protein : undefined,
  }

  const recipeIds: string[] = Array.isArray(b.recipe_ids)
    ? b.recipe_ids.filter((id): id is string => typeof id === 'string')
    : []

  try {
    const menu = await createMenu(menuData)
    if (recipeIds.length > 0) {
      await setMenuRecipes(menu.id, recipeIds)
    }
    const full = await getMenu(menu.id)
    return NextResponse.json({ menu: full }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function isValidProtein(v: unknown): v is 'kjott' | 'kylling' | 'fisk' | 'vegetar' {
  return ['kjott', 'kylling', 'fisk', 'vegetar'].includes(v as string)
}
