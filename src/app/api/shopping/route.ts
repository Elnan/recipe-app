import { NextRequest, NextResponse } from 'next/server'
import { getShoppingListItems, addShoppingListItem } from '../../../../lib/shopping'
import type { NewShoppingListItem } from '../../../../lib/shopping'

export async function GET() {
  try {
    const items = await getShoppingListItems()
    return NextResponse.json({ items })
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

  const item = body as Partial<NewShoppingListItem>

  if (!item.name || typeof item.name !== 'string') {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
  }
  if (!item.store_section) {
    return NextResponse.json({ error: 'Missing required field: store_section' }, { status: 400 })
  }

  try {
    const created = await addShoppingListItem({
      name:             item.name,
      amount:           item.amount ?? null,
      unit:             item.unit ?? null,
      store_section:    item.store_section,
      notes:            item.notes ?? null,
      source_recipe_id: null,
      source_menu_id:   null,
      is_manual:        true,
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
