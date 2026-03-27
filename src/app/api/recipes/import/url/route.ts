import { NextRequest, NextResponse } from 'next/server'
import { extractSchemaOrg } from '../../../../../../lib/parsers/schema-org'
import { parseWithAi } from '../../../../../../lib/parsers/ai-parser'
import { mapToNewRecipe } from '../../../../../../lib/parsers/map-recipe'
import { getRecipeBySourceUrl } from '../../../../../../lib/recipes'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url, forceReimport } = body as Record<string, unknown>

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 })
  }

  try { new URL(url) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    // Check cache first — skip when forceReimport is true
    if (!forceReimport) {
      const existing = await getRecipeBySourceUrl(url)
      if (existing) {
        return NextResponse.json({ cached: true, recipe: existing })
      }
    }

    // Fetch page HTML
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' },
    })
    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${pageRes.status} ${pageRes.statusText}` },
        { status: 500 }
      )
    }
    const html = await pageRes.text()

    // schema.org first — AI only as fallback
    const schemaResult = extractSchemaOrg(html)
    const parsed = schemaResult
      ?? await parseWithAi({ type: 'url', content: htmlToText(html), sourceIdentifier: url })

    const recipe = mapToNewRecipe(parsed, url)
    return NextResponse.json({ cached: false, recipe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Strips HTML tags and collapses whitespace for AI text input
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000) // keep well within token limits
}
