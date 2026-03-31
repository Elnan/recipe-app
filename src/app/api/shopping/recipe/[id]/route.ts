import { NextRequest, NextResponse } from 'next/server'
import { getRecipe } from '../../../../../../lib/recipes'
import { addRecipeToShoppingList } from '../../../../../../lib/shopping'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const recipe = await getRecipe(id)
    await addRecipeToShoppingList(recipe)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
