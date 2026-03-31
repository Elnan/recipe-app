import type { NewRecipe } from '../../types/recipe'
import type { SchemaOrgResult } from './schema-org'
import type { AiParseResult } from './ai-parser'
import { normaliseIngredientName, extractPreparationNotes } from '../ingredient-normaliser'

const UNIT_CONVERSIONS: Record<string, (amount: number) => { amount: number; unit: string }> = {
  'cup':    a => ({ amount: Math.round(a * 24) / 10, unit: 'dl' }),
  'cups':   a => ({ amount: Math.round(a * 24) / 10, unit: 'dl' }),
  'tbsp':   a => ({ amount: a,                        unit: 'ss' }),
  'tsp':    a => ({ amount: a,                        unit: 'ts' }),
  'oz':     a => ({ amount: Math.round(a * 28.35),    unit: 'g'  }),
  'fl oz':  a => ({ amount: Math.round(a * 29.6),     unit: 'ml' }),
  'lb':     a => ({ amount: Math.round(a * 453.6),    unit: 'g'  }),
  'pound':  a => ({ amount: Math.round(a * 453.6),    unit: 'g'  }),
  'pounds': a => ({ amount: Math.round(a * 453.6),    unit: 'g'  }),
}

function normaliseUnit(amount: number, unit: string): { amount: number; unit: string } {
  const conv = UNIT_CONVERSIONS[unit.toLowerCase().trim()]
  return conv ? conv(amount) : { amount, unit }
}

export function mapToNewRecipe(
  parsed: SchemaOrgResult | AiParseResult,
  sourceUrl?: string
): NewRecipe {
  return {
    title:             parsed.title,
    description:       parsed.description,
    image_url:         parsed.image_url,
    source_url:        sourceUrl,
    servings:          parsed.servings,
    prep_time_minutes: parsed.prep_time_minutes,
    cook_time_minutes: parsed.cook_time_minutes,
    category:          parsed.category ?? 'other',
    cuisine:           parsed.cuisine,
    cooking_method:    (parsed as AiParseResult).cooking_method,
    protein_type:      (parsed as AiParseResult).protein_type,
    dietary:           parsed.dietary,
    tags:              parsed.tags,
    ingredients:       parsed.ingredients.map(ing => {
      const normalisedUnit = ing.unit ? normaliseUnit(ing.amount ?? 1, ing.unit) : { amount: ing.amount, unit: ing.unit }
      const prepNotes = extractPreparationNotes(ing.name)
      return {
        ...ing,
        name:   normaliseIngredientName(ing.name),
        amount: normalisedUnit.amount ?? ing.amount,
        unit:   normalisedUnit.unit   ?? ing.unit,
        notes:  ing.notes ?? prepNotes ?? undefined,
      }
    }),
    steps:             parsed.steps,
    rating:            undefined,
    menu_name:         undefined,
  }
}
