import type { Ingredient, RecipeStep, RecipeCategory } from '../../types/recipe'

export type SchemaOrgResult = {
  title:              string
  description?:       string
  image_url?:         string
  servings:           number
  prep_time_minutes?: number
  cook_time_minutes?: number
  cuisine?:           string
  category?:          RecipeCategory
  dietary?:           string[]
  tags?:              string[]
  ingredients:        Ingredient[]
  steps:              RecipeStep[]
}

// Returns null if extraction fails or result is missing critical fields
export function extractSchemaOrg(html: string): SchemaOrgResult | null {
  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]

  for (const match of scripts) {
    try {
      const raw = JSON.parse(match[1])
      const nodes: unknown[] = Array.isArray(raw)
        ? raw
        : raw['@graph'] ?? [raw]

      const node = nodes.find(
        (n): n is Record<string, unknown> =>
          typeof n === 'object' && n !== null &&
          (n as Record<string, unknown>)['@type'] === 'Recipe'
      )
      if (!node) continue

      const result = mapNode(node)
      if (isComplete(result)) return result
    } catch {
      // malformed JSON — try next script block
    }
  }

  return null
}

// A result is "complete" enough to skip AI if it has title, ≥1 ingredient, ≥1 step
function isComplete(r: SchemaOrgResult | null): r is SchemaOrgResult {
  return r != null && r.title.length > 0 && r.ingredients.length > 0 && r.steps.length > 0
}

function mapNode(node: Record<string, unknown>): SchemaOrgResult | null {
  const title = str(node.name)
  if (!title) return null

  return {
    title,
    description:       str(node.description) ?? undefined,
    image_url:         extractImage(node.image),
    servings:          parseYield(node.recipeYield),
    prep_time_minutes: parseDuration(node.prepTime),
    cook_time_minutes: parseDuration(node.cookTime),
    cuisine:           str(node.recipeCuisine) ?? undefined,
    category:          mapCategory(node.recipeCategory),
    dietary:           mapDietary(node.suitableForDiet),
    tags:              parseKeywords(node.keywords),
    ingredients:       parseIngredients(node.recipeIngredient),
    steps:             parseSteps(node.recipeInstructions),
  }
}

// ── Field parsers ─────────────────────────────────────────────────────────────

function str(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim() || null
  return null
}

function extractImage(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return extractImage(v[0])
  if (typeof v === 'object' && v !== null) return str((v as Record<string, unknown>).url) ?? undefined
  return undefined
}

// Parses ISO 8601 duration strings: PT1H30M → 90
function parseDuration(v: unknown): number | undefined {
  const s = str(v)
  if (!s) return undefined
  const hours   = s.match(/(\d+)H/)?.[1] ?? '0'
  const minutes = s.match(/(\d+)M/)?.[1] ?? '0'
  const total   = parseInt(hours) * 60 + parseInt(minutes)
  return total > 0 ? total : undefined
}

function parseYield(v: unknown): number {
  if (typeof v === 'number') return v
  const s = str(v) ?? ''
  const n = parseInt(s)
  return isNaN(n) || n < 1 ? 4 : n  // default to 4 servings
}

const CATEGORY_MAP: Record<string, RecipeCategory> = {
  dinner:    'dinner',
  lunch:     'dinner',
  breakfast: 'breakfast',
  brunch:    'breakfast',
  baking:    'baking',
  bread:     'baking',
  dessert:   'dessert',
  cake:      'dessert',
  cookie:    'dessert',
}

function mapCategory(v: unknown): RecipeCategory | undefined {
  const s = str(v)?.toLowerCase() ?? ''
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (s.includes(key)) return cat
  }
  return undefined
}

const DIETARY_MAP: Record<string, string> = {
  vegetariandiet:  'vegetarian',
  vegandiet:       'vegan',
  glutenfreediet:  'gluten-free',
  dairyfreediet:   'dairy-free',
  lowcaloriediet:  'vegetarian',  // best-effort mapping
}

function mapDietary(v: unknown): string[] | undefined {
  const values = Array.isArray(v) ? v : v ? [v] : []
  const mapped = values
    .map(d => {
      const key = str(d)?.toLowerCase().replace(/[^a-z]/g, '') ?? ''
      return DIETARY_MAP[key] ?? null
    })
    .filter((d): d is string => d !== null)
  return mapped.length > 0 ? [...new Set(mapped)] : undefined
}

function parseKeywords(v: unknown): string[] | undefined {
  const s = str(v)
  if (!s) return undefined
  const tags = s.split(',').map(t => t.trim()).filter(Boolean)
  return tags.length > 0 ? tags : undefined
}

// ── Ingredients ───────────────────────────────────────────────────────────────

// Parses "2 cups flour, sifted" → { amount: 2, unit: 'cups', name: 'flour', notes: 'sifted' }
function parseIngredients(v: unknown): Ingredient[] {
  if (!Array.isArray(v)) return []
  return v.flatMap(raw => {
    const s = str(raw)
    if (!s) return []
    return [parseIngredientString(s)]
  })
}

const AMOUNT_RE = /^([\d\s\u00BC-\u00BE\u2150-\u215E\/]+)/
const UNIT_RE   = /^(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|g|kg|ml|dl|l|oz|lb|lbs|pound|pounds|clove|cloves|slice|slices|piece|pieces|stk|handful|pinch|bunch|can|cans|boks|jar|jars|package|packages|pkg|pk|ss|ts)\b/i

function parseIngredientString(s: string): Ingredient {
  const clean = s.trim()
  let rest    = clean

  // Amount
  const amountMatch = rest.match(AMOUNT_RE)
  let amount = 1
  if (amountMatch) {
    amount = parseFraction(amountMatch[1].trim())
    rest   = rest.slice(amountMatch[1].length).trim()
  }

  // Unit
  const unitMatch = rest.match(UNIT_RE)
  let unit = ''
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase()
    rest = rest.slice(unitMatch[1].length).trim()
  }

  // Notes: text after comma
  const commaIdx = rest.indexOf(',')
  let name  = commaIdx >= 0 ? rest.slice(0, commaIdx).trim() : rest.trim()
  let notes = commaIdx >= 0 ? rest.slice(commaIdx + 1).trim() : undefined

  // Normalise unit plurals and Norwegian units
  if (unit === 'cups') unit = 'cup'
  if (unit === 'tablespoons' || unit === 'tablespoon') unit = 'tbsp'
  if (unit === 'teaspoons'   || unit === 'teaspoon')   unit = 'tsp'
  if (unit === 'pounds' || unit === 'pound' || unit === 'lbs') unit = 'lb'
  if (unit === 'stk')  unit = 'piece'
  if (unit === 'ss')   unit = 'tbsp'
  if (unit === 'ts')   unit = 'tsp'
  if (unit === 'pk')   unit = 'package'
  if (unit === 'boks') unit = 'can'
  // dl kept as-is

  return { name: name || clean, amount, unit, notes }
}

function parseFraction(raw: string): number {
  let s = raw
  // Unicode fractions
  const unicodeFracs: Record<string, number> = {
    '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 0.333, '⅔': 0.667,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  }
  let result = 0
  for (const [ch, val] of Object.entries(unicodeFracs)) {
    if (s.includes(ch)) { result += val; s = s.replace(ch, '') }
  }
  // ASCII fraction e.g. "1/3"
  const fracMatch = s.match(/(\d+)\s*\/\s*(\d+)/)
  if (fracMatch) {
    result += parseInt(fracMatch[1]) / parseInt(fracMatch[2])
    s = s.replace(fracMatch[0], '')
  }
  // Whole number remainder
  const whole = parseInt(s.trim())
  if (!isNaN(whole)) result += whole
  return result || 1
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function parseSteps(v: unknown): RecipeStep[] {
  const items = Array.isArray(v) ? v : v ? [v] : []
  const steps: RecipeStep[] = []
  let order = 1

  for (const item of items) {
    if (typeof item === 'string') {
      steps.push({ order: order++, instruction: item.trim(), ingredients_used: [] })
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>
      if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
        for (const sub of obj.itemListElement) {
          const text = extractStepText(sub)
          if (text) steps.push({ order: order++, instruction: text, ingredients_used: [] })
        }
      } else {
        const text = extractStepText(obj)
        if (text) steps.push({ order: order++, instruction: text, ingredients_used: [] })
      }
    }
  }

  return steps
}

function extractStepText(obj: unknown): string | null {
  if (typeof obj === 'string') return obj.trim() || null
  if (typeof obj === 'object' && obj !== null) {
    const o = obj as Record<string, unknown>
    return str(o.text) ?? str(o.name)
  }
  return null
}
