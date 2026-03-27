import { NextRequest, NextResponse } from 'next/server'
import { getMenu, updateMenu, deleteMenu } from '../../../../../lib/menus'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const menu = await getMenu(id)
    return NextResponse.json({ menu })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if (typeof b.name === 'string') updates.name = b.name
  if (['kjott', 'kylling', 'fisk', 'vegetar'].includes(b.dominant_protein as string)) {
    updates.dominant_protein = b.dominant_protein
  }

  try {
    const menu = await updateMenu(id, updates)
    return NextResponse.json({ menu })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await deleteMenu(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
