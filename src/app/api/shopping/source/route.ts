import { NextRequest, NextResponse } from 'next/server'
import { removeBySource } from '../../../../../lib/shopping'

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const recipeId = searchParams.get('recipe_id')
  const menuId   = searchParams.get('menu_id')

  if (!recipeId && !menuId) {
    return NextResponse.json(
      { error: 'Provide either recipe_id or menu_id as a query parameter' },
      { status: 400 },
    )
  }

  try {
    if (recipeId) await removeBySource('source_recipe_id', recipeId)
    if (menuId)   await removeBySource('source_menu_id', menuId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
