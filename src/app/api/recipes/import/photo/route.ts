import { NextRequest, NextResponse } from 'next/server'
import { parseWithAi } from '../../../../../../lib/parsers/ai-parser'
import { mapToNewRecipe } from '../../../../../../lib/parsers/map-recipe'

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DATA_URI_RE = /^data:(image\/\w+);base64,/

function stripDataUri(dataUri: string): { data: string; mediaType: string } {
  const match = dataUri.match(DATA_URI_RE)
  if (match) {
    return { data: dataUri.replace(DATA_URI_RE, ''), mediaType: match[1] }
  }
  return { data: dataUri, mediaType: 'image/jpeg' }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { images, image, mediaType } = body as Record<string, unknown>

  // Multi-image path (new)
  if (Array.isArray(images) && images.length > 0) {
    if (images.length > 6) {
      return NextResponse.json({ error: 'Maximum 6 images allowed' }, { status: 400 })
    }

    const parsed_images: Array<{ data: string; mediaType: string }> = []
    for (const img of images) {
      if (typeof img !== 'string') {
        return NextResponse.json({ error: 'Each image must be a base64 string' }, { status: 400 })
      }
      const { data, mediaType: mt } = stripDataUri(img)
      if (!SUPPORTED_MEDIA_TYPES.includes(mt)) {
        return NextResponse.json(
          { error: `Unsupported image type. Must be one of: ${SUPPORTED_MEDIA_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      parsed_images.push({ data, mediaType: mt })
    }

    try {
      const parsed = await parseWithAi({ type: 'photos', images: parsed_images })
      const recipe = mapToNewRecipe(parsed)
      return NextResponse.json({ recipe })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // Single-image path (legacy)
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Missing required field: image or images' }, { status: 400 })
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
    const parsed = await parseWithAi({ type: 'photo', content: image as string, mediaType: mediaType as string })
    const recipe = mapToNewRecipe(parsed)
    return NextResponse.json({ recipe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
