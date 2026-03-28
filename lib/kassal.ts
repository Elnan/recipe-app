import Anthropic from '@anthropic-ai/sdk'
import { supabase } from './supabase'
import { logAiCall } from './ai-logger'
import { isNorwegianDomain, translateToNorwegian } from './ingredient-dictionary'

const KASSAL_BASE = 'https://kassal.app/api/v1'
const MODEL = 'claude-haiku-4-5-20251001'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface KassalProduct {
  id: number
  name: string
  weight: number | null
  weight_unit: string | null
  current_price: number | null
}

export interface PackageSizeResult {
  packageSizeG?: number
  packageSizeMl?: number
  packageSizeCount?: number
  unitType: 'weight' | 'volume' | 'piece' | 'unknown'
  kassalName?: string
  kassalProductId?: number
}

// ── Kassal search ──────────────────────────────────────────────────────────

export async function searchKassal(query: string): Promise<KassalProduct | null> {
  const key = process.env.KASSAL_API_KEY
  if (!key) {
    console.warn('[kassal] KASSAL_API_KEY not set')
    return null
  }

  const url = `${KASSAL_BASE}/products?search=${encodeURIComponent(query)}&size=5`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    })
  } catch (err) {
    console.error('[kassal] fetch error:', err)
    return null
  }

  if (!res.ok) {
    console.error('[kassal] API error:', res.status, await res.text())
    return null
  }

  const json = await res.json() as { data?: KassalProduct[] }
  const results = json.data ?? []
  if (results.length === 0) return null

  // Prefer products with weight set
  const withWeight = results.filter(p => p.weight != null)
  return withWeight.length > 0 ? withWeight[0] : results[0]
}

// ── Weight normalisation from Kassal units ─────────────────────────────────

function normaliseKassalWeight(product: KassalProduct): Omit<PackageSizeResult, 'kassalName' | 'kassalProductId'> {
  const { weight, weight_unit } = product
  if (weight == null || weight === 0 || weight_unit == null) {
    return { unitType: 'unknown' }
  }

  const u = weight_unit.toLowerCase().trim()

  if (u === 'g')     return { packageSizeG: weight,           unitType: 'weight' }
  if (u === 'kg')    return { packageSizeG: weight * 1000,    unitType: 'weight' }
  if (u === 'ml')    return { packageSizeMl: weight,          unitType: 'volume' }
  if (u === 'l')     return { packageSizeMl: weight * 1000,   unitType: 'volume' }
  if (u === 'dl')    return { packageSizeMl: weight * 100,    unitType: 'volume' }
  if (u === 'piece') return { packageSizeCount: weight,       unitType: 'piece'  }

  return { unitType: 'unknown' }
}

// ── AI translation fallback ────────────────────────────────────────────────

async function translateWithAi(name: string): Promise<string> {
  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 64,
    messages:   [{ role: 'user', content: `Translate this cooking ingredient name to Norwegian. Return ONLY the Norwegian word(s), nothing else: ${name}` }],
  })

  await logAiCall({
    sourceType:       'text',
    model:            MODEL,
    inputTokens:      response.usage.input_tokens,
    outputTokens:     response.usage.output_tokens,
    sourceIdentifier: `kassal-translate:${name}`,
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''
  return text.trim()
}

// ── Main export ────────────────────────────────────────────────────────────

export async function getPackageSize(
  ingredientName: string,
  sourceUrl?: string,
): Promise<PackageSizeResult | null> {
  const normalised = ingredientName.toLowerCase().trim()

  // 1. Check cache
  const { data: cached } = await supabase
    .from('ingredient_products')
    .select('*')
    .eq('ingredient_name', normalised)
    .maybeSingle()

  if (cached?.lookup_attempted) {
    if (cached.unit_type === 'unknown' && !cached.kassal_product_id) return null
    return {
      packageSizeG:     cached.package_size_g     ?? undefined,
      packageSizeMl:    cached.package_size_ml    ?? undefined,
      packageSizeCount: cached.package_size_count ?? undefined,
      unitType:         cached.unit_type as PackageSizeResult['unitType'],
      kassalName:       cached.kassal_name        ?? undefined,
      kassalProductId:  cached.kassal_product_id  ?? undefined,
    }
  }

  // 2. Determine Norwegian name
  let norwegianName: string

  if (sourceUrl && isNorwegianDomain(sourceUrl)) {
    norwegianName = normalised
  } else {
    const fromDict = translateToNorwegian(normalised)
    if (fromDict) {
      norwegianName = fromDict
    } else {
      try {
        norwegianName = await translateWithAi(normalised)
      } catch {
        norwegianName = normalised
      }
    }
  }

  // 3. Search Kassal
  const product = await searchKassal(norwegianName)

  // 4. Normalise result
  let result: PackageSizeResult

  if (product) {
    const sizes = normaliseKassalWeight(product)
    result = {
      ...sizes,
      kassalName:      product.name,
      kassalProductId: product.id,
    }
  } else {
    result = { unitType: 'unknown' }
  }

  // 5. Upsert into ingredient_products
  await supabase.from('ingredient_products').upsert({
    ingredient_name:    normalised,
    norwegian_name:     norwegianName,
    kassal_product_id:  result.kassalProductId   ?? null,
    kassal_name:        result.kassalName        ?? null,
    package_size_g:     result.packageSizeG      ?? null,
    package_size_ml:    result.packageSizeMl     ?? null,
    package_size_count: result.packageSizeCount  ?? null,
    unit_type:          result.unitType,
    lookup_attempted:   true,
  }, { onConflict: 'ingredient_name' })

  return result.unitType === 'unknown' && !result.kassalProductId ? null : result
}
