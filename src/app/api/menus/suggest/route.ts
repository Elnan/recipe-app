import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getRecipes } from '../../../../../lib/recipes'
import { logAiCall } from '../../../../../lib/ai-logger'
import { getPackageSize } from '../../../../../lib/kassal'
import { toGrams, toMl, formatWeight, formatVolume } from '../../../../../lib/unit-converter'
import type { Recipe } from '../../../../../types/recipe'

const MODEL = 'claude-haiku-4-5-20251001'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (!b.anchor_recipe_id || typeof b.anchor_recipe_id !== 'string') {
    return NextResponse.json({ error: 'Missing required field: anchor_recipe_id' }, { status: 400 })
  }

  const anchorId = b.anchor_recipe_id

  try {
    // Anchor is always a dinner recipe (picker only shows dinner) — fetch once
    const dinnerRecipes = await getRecipes({ category: 'dinner' })

    const anchor = dinnerRecipes.find((r: Recipe) => r.id === anchorId)
    if (!anchor) {
      return NextResponse.json({ error: 'Anchor recipe not found' }, { status: 404 })
    }

    const candidates = dinnerRecipes.filter((r: Recipe) => r.id !== anchorId)

    if (candidates.length < 3) {
      const ids = candidates.slice(0, 3).map(r => r.id)
      return NextResponse.json({ recipe_ids: ids })
    }

    // Fetch package sizes for anchor ingredients
    const anchorIngredients = await Promise.all(
      anchor.ingredients.map(async ing => {
        const pkg = await getPackageSize(ing.name, anchor.source_url ?? undefined)
        const usedG  = ing.unit ? toGrams(ing.amount, ing.unit)  : null
        const usedMl = ing.unit ? toMl(ing.amount, ing.unit)     : null
        const leftoverG  = pkg?.packageSizeG  != null && usedG  != null
          ? Math.max(0, pkg.packageSizeG  - usedG)  : null
        const leftoverMl = pkg?.packageSizeMl != null && usedMl != null
          ? Math.max(0, pkg.packageSizeMl - usedMl) : null
        return {
          name:         ing.name,
          usedG,        usedMl,
          packageSizeG:  pkg?.packageSizeG,
          packageSizeMl: pkg?.packageSizeMl,
          leftoverG,    leftoverMl,
          isFlexible:   pkg?.unitType === 'piece' || !pkg,
        }
      })
    )

    // Build leftover context string
    const leftoverLines = anchorIngredients
      .filter(i => i.leftoverG != null || i.leftoverMl != null)
      .map(i => {
        if (i.leftoverG  != null) return `- ${i.name}: ${formatWeight(i.leftoverG)} leftover`
        if (i.leftoverMl != null) return `- ${i.name}: ${formatVolume(i.leftoverMl)} leftover`
      })
      .join('\n')

    const candidateList = candidates
      .map((r: Recipe) => {
        const ings = r.ingredients.map(ing => ing.name).join(', ')
        return `ID: ${r.id} | Title: ${r.title} | Ingredients: ${ings}`
      })
      .join('\n')

    const prompt = `Given this anchor dinner and its leftovers after cooking, suggest 3 dinner recipes from the list that efficiently use these leftovers and minimise waste. Consider protein variety across the week. Return ONLY a JSON array of 3 recipe IDs.

Anchor: ${anchor.title}
${leftoverLines ? `Leftovers available:\n${leftoverLines}` : 'No leftover data available yet.'}

Available recipes:
${candidateList}`

    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 256,
      messages:   [{ role: 'user', content: prompt }],
    })

    await logAiCall({
      sourceType:       'text',
      model:            MODEL,
      inputTokens:      response.usage.input_tokens,
      outputTokens:     response.usage.output_tokens,
      sourceIdentifier: `menu-suggest:${anchorId}`,
    })

    const text  = response.content.find(blk => blk.type === 'text')?.text ?? ''
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let recipeIds: string[]
    try {
      const parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) throw new Error('Expected array')
      recipeIds = parsed.filter((id): id is string => typeof id === 'string').slice(0, 3)
    } catch {
      return NextResponse.json({ error: 'AI returned unparseable response' }, { status: 502 })
    }

    return NextResponse.json({ recipe_ids: recipeIds })
  } catch (err) {
    console.error('Suggest route error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
