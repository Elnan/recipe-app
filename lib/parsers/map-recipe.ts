import type { NewRecipe } from '../../types/recipe'
import type { SchemaOrgResult } from './schema-org'
import type { AiParseResult } from './ai-parser'

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
    ingredients:       parsed.ingredients,
    steps:             parsed.steps,
    rating:            undefined,
    menu_name:         undefined,
  }
}
