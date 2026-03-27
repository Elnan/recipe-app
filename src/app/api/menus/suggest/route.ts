import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getRecipes } from '../../../../../lib/recipes'
import { logAiCall } from '../../../../../lib/ai-logger'
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

    const anchorIngredients = anchor.ingredients.map((ing) => ing.name).join(', ')

    const candidateList = candidates
      .map((r: Recipe) => {
        const ings = r.ingredients.map((ing) => ing.name).join(', ')
        return `ID: ${r.id} | Title: ${r.title} | Ingredients: ${ings}`
      })
      .join('\n')

    const prompt = `Given this anchor dinner recipe and its ingredients, suggest 3 other dinner recipes from the list that would work well in the same week because they share ingredients and minimize waste. Consider protein variety. Return ONLY a JSON array of 3 recipe IDs from the provided list.

Anchor recipe: ${anchor.title}
Anchor ingredients: ${anchorIngredients}

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

    const text = response.content.find((blk) => blk.type === 'text')?.text ?? ''
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
