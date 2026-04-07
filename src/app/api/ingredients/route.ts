import { NextRequest, NextResponse } from 'next/server'
import { removeIngredientProduct } from '../../../../lib/store-sections'

export async function DELETE(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  }

  try {
    await removeIngredientProduct(name)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
