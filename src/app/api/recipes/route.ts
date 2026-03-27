import { NextRequest, NextResponse } from 'next/server'
import { saveRecipe } from '../../../../lib/recipes'
import type { NewRecipe } from '../../../../types/recipe'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const recipe = body as Partial<NewRecipe>

  if (!recipe.title || typeof recipe.title !== 'string') {
    return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 })
  }
  if (!Array.isArray(recipe.ingredients)) {
    return NextResponse.json({ error: 'Missing required field: ingredients' }, { status: 400 })
  }
  if (!Array.isArray(recipe.steps)) {
    return NextResponse.json({ error: 'Missing required field: steps' }, { status: 400 })
  }
  if (!recipe.category) {
    return NextResponse.json({ error: 'Missing required field: category' }, { status: 400 })
  }
  if (typeof recipe.servings !== 'number' || recipe.servings < 1) {
    return NextResponse.json({ error: 'Missing required field: servings' }, { status: 400 })
  }

  try {
    const saved = await saveRecipe(recipe as NewRecipe)
    return NextResponse.json({ recipe: saved }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
