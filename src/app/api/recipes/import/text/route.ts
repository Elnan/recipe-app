import { NextRequest, NextResponse } from 'next/server'
import { parseWithAi } from '../../../../../../lib/parsers/ai-parser'
import { mapToNewRecipe } from '../../../../../../lib/parsers/map-recipe'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text } = body as Record<string, unknown>

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing required field: text' }, { status: 400 })
  }

  try {
    const parsed = await parseWithAi({ type: 'text', content: text })
    const recipe = mapToNewRecipe(parsed)
    return NextResponse.json({ recipe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
