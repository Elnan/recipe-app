import { NextRequest, NextResponse } from 'next/server'
import { lookupRecipeIngredients } from '../../../../../lib/ingredient-lookup'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (!b.recipe_id || typeof b.recipe_id !== 'string') {
    return NextResponse.json({ error: 'Missing required field: recipe_id' }, { status: 400 })
  }

  // Fire and forget — do not await
  lookupRecipeIngredients(b.recipe_id).catch(err =>
    console.error('[ingredients/lookup] Background lookup failed:', err)
  )

  return new NextResponse(null, { status: 202 })
}
