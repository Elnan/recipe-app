import { NextRequest, NextResponse } from 'next/server'
import { getMenu } from '../../../../../../lib/menus'
import { addMenuToShoppingList } from '../../../../../../lib/shopping'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const menu = await getMenu(id)
    await addMenuToShoppingList(menu)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
