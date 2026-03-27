import { NextRequest, NextResponse } from 'next/server'
import { parseWithAi } from '../../../../../../lib/parsers/ai-parser'
import { mapToNewRecipe } from '../../../../../../lib/parsers/map-recipe'

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { image, mediaType } = body as Record<string, unknown>

  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Missing required field: image' }, { status: 400 })
  }
  if (!mediaType || typeof mediaType !== 'string') {
    return NextResponse.json({ error: 'Missing required field: mediaType' }, { status: 400 })
  }
  if (!SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
    return NextResponse.json(
      { error: `Unsupported mediaType. Must be one of: ${SUPPORTED_MEDIA_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const parsed = await parseWithAi({ type: 'photo', content: image, mediaType })
    const recipe = mapToNewRecipe(parsed)
    return NextResponse.json({ recipe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
