import Anthropic from '@anthropic-ai/sdk'
import { logAiCall } from '../ai-logger'
import type { SchemaOrgResult } from './schema-org'

export type AiParseResult = SchemaOrgResult & {
  cooking_method?: 'pan' | 'oven' | 'pot' | 'one-pan' | 'grill' | 'wok' | 'no-cook'
  protein_type?: 'kjott' | 'kylling' | 'fisk' | 'vegetar'
}

const MODEL = 'claude-haiku-4-5-20251001'

const client = new Anthropic()

// Shared system prompt — instructs the model to return strict JSON only
const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract recipe data from the provided content and return ONLY valid JSON matching this exact structure — no prose, no markdown, no code fences:

{
  "title": string,
  "description": string | null,
  "servings": number,
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "cuisine": string | null,
  "category": "dinner" | "breakfast" | "baking" | "dessert" | "other",
  "cooking_method": "pan" | "oven" | "pot" | "one-pan" | "grill" | "wok" | "no-cook" | null,
  "protein_type": "kjott" | "kylling" | "fisk" | "vegetar" | null,
  "dietary": string[],
  "tags": string[],
  "ingredients": [
    { "name": string, "amount": number, "unit": string, "notes": string | null }
  ],
  "steps": [
    { "order": number, "instruction": string, "ingredients_used": string[] }
  ]
}

Rules:
- amounts must be decimals (e.g. 0.5, 1.0, 2.5) — never fractions or strings
- units must be stored separately from amounts
- ingredients_used must contain exact name strings from the ingredients array
- cooking_method must be one of the listed values or null if unclear
- protein_type must be one of the four values: kjott (beef, pork, lamb), kylling (chicken, turkey), fisk (fish, seafood), vegetar (no meat or fish) — or null if unclear
- if a field is unknown, use null (never omit it)
- category must be one of the five values listed above`

export type AiParseInput =
  | { type: 'text';  content: string;                    sourceIdentifier?: string }
  | { type: 'url';   content: string;                    sourceIdentifier?: string }
  | { type: 'photo'; content: string; mediaType: string; sourceIdentifier?: string }

// Returns parsed recipe or throws if AI response is unparseable
export async function parseWithAi(input: AiParseInput): Promise<AiParseResult> {
  const userMessage = buildUserMessage(input)

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 2048,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  // Log every AI call — non-fatal if logging fails (handled inside logAiCall)
  await logAiCall({
    sourceType:       input.type,
    model:            MODEL,
    inputTokens:      response.usage.input_tokens,
    outputTokens:     response.usage.output_tokens,
    sourceIdentifier: input.sourceIdentifier ?? undefined,
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''
  return parseJsonResponse(text)
}

// ── Message builders ──────────────────────────────────────────────────────────

function buildUserMessage(input: AiParseInput): Anthropic.MessageParam['content'] {
  if (input.type === 'photo') {
    return [
      {
        type:   'image',
        source: {
          type:       'base64',
          media_type: input.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data:       input.content,
        },
      },
      {
        type: 'text',
        text: 'Extract the recipe from this image.',
      },
    ]
  }

  if (input.type === 'text') {
    // Strip hashtags — Instagram posts are a primary source
    const cleaned = input.content.replace(/#\w+/g, '').trim()
    return `Extract the recipe from this text:\n\n${cleaned}`
  }

  // url — content is the page's visible text, already stripped of HTML by the route handler
  return `Extract the recipe from this web page content:\n\n${input.content}`
}

// ── Response parser ───────────────────────────────────────────────────────────

function parseJsonResponse(text: string): AiParseResult {
  // Strip any accidental markdown code fences
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(clean)
  } catch {
    throw new Error(`AI returned non-JSON response: ${clean.slice(0, 200)}`)
  }

  // Validate critical fields
  if (typeof raw.title !== 'string' || !raw.title) {
    throw new Error('AI response missing required field: title')
  }
  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
    throw new Error('AI response missing required field: ingredients')
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error('AI response missing required field: steps')
  }

  return {
    title:             raw.title,
    description:       typeof raw.description === 'string' ? raw.description : undefined,
    servings:          typeof raw.servings === 'number' && raw.servings > 0 ? raw.servings : 4,
    prep_time_minutes: typeof raw.prep_time_minutes === 'number' ? raw.prep_time_minutes : undefined,
    cook_time_minutes: typeof raw.cook_time_minutes === 'number' ? raw.cook_time_minutes : undefined,
    cuisine:           typeof raw.cuisine === 'string' ? raw.cuisine : undefined,
    category:          isValidCategory(raw.category) ? raw.category : undefined,
    cooking_method:    isValidCookingMethod(raw.cooking_method) ? raw.cooking_method : undefined,
    protein_type:      isValidProteinType(raw.protein_type) ? raw.protein_type : undefined,
    dietary:           Array.isArray(raw.dietary) ? raw.dietary.filter((d): d is string => typeof d === 'string') : undefined,
    tags:              Array.isArray(raw.tags)    ? raw.tags.filter((t): t is string => typeof t === 'string')    : undefined,
    ingredients:       (raw.ingredients as unknown[]).map(normaliseIngredient),
    steps:             (raw.steps as unknown[]).map(normaliseStep),
  }
}

function isValidCategory(v: unknown): v is 'dinner' | 'breakfast' | 'baking' | 'dessert' | 'other' {
  return ['dinner', 'breakfast', 'baking', 'dessert', 'other'].includes(v as string)
}

function isValidCookingMethod(v: unknown): v is 'pan' | 'oven' | 'pot' | 'one-pan' | 'grill' | 'wok' | 'no-cook' {
  return ['pan', 'oven', 'pot', 'one-pan', 'grill', 'wok', 'no-cook'].includes(v as string)
}

function isValidProteinType(v: unknown): v is 'kjott' | 'kylling' | 'fisk' | 'vegetar' {
  return ['kjott', 'kylling', 'fisk', 'vegetar'].includes(v as string)
}

function normaliseIngredient(raw: unknown) {
  const i = raw as Record<string, unknown>
  return {
    name:   String(i.name   ?? ''),
    amount: typeof i.amount === 'number' ? i.amount : 1,
    unit:   String(i.unit   ?? ''),
    notes:  typeof i.notes === 'string' ? i.notes : undefined,
  }
}

function normaliseStep(raw: unknown) {
  const s = raw as Record<string, unknown>
  return {
    order:            typeof s.order === 'number' ? s.order : 1,
    instruction:      String(s.instruction ?? ''),
    ingredients_used: Array.isArray(s.ingredients_used)
      ? s.ingredients_used.filter((x): x is string => typeof x === 'string')
      : [],
  }
}
