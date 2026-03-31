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

    // Fetch page HTML — use realistic browser headers to avoid bot detection
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    })
    if (!pageRes.ok) {
      const hint = pageRes.status === 402 || pageRes.status === 403
        ? ' — the site may be blocking automated requests'
        : ''
      return NextResponse.json(
        { error: `Could not fetch that URL (${pageRes.status} ${pageRes.statusText})${hint}` },
        { status: 422 }
      )
    }
    const html = await pageRes.text()

    // schema.org first — AI only as fallback
    const schemaResult = extractSchemaOrg(html)
    let parsed
    if (schemaResult) {
      parsed = schemaResult
    } else {
      try {
        parsed = await parseWithAi({ type: 'url', content: htmlToText(html), sourceIdentifier: url })
      } catch (err) {
        console.error('[import/url] AI fallback error:', err)
        throw err
      }
    }

    const recipe = mapToNewRecipe(parsed, url)
    return NextResponse.json({ cached: false, recipe })
  } catch (err) {
    console.error('[import/url] Unhandled error:', err)
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
