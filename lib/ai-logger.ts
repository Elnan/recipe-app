import { supabase } from './supabase'

// Haiku pricing (per million tokens) — update if Anthropic changes rates
const HAIKU_INPUT_COST_PER_M  = 0.80
const HAIKU_OUTPUT_COST_PER_M = 4.00

export type AiLogEntry = {
  sourceType:       'url' | 'text' | 'photo'
  model:            string
  inputTokens:      number
  outputTokens:     number
  sourceIdentifier?: string   // URL for url imports, omit for text/photo
  recipeId?:        string    // set after recipe is saved
}

export async function logAiCall(entry: AiLogEntry): Promise<void> {
  const costUsd =
    (entry.inputTokens  / 1_000_000) * HAIKU_INPUT_COST_PER_M +
    (entry.outputTokens / 1_000_000) * HAIKU_OUTPUT_COST_PER_M

  const { error } = await supabase.from('ai_logs').insert({
    source_type:       entry.sourceType,
    model:             entry.model,
    input_tokens:      entry.inputTokens,
    output_tokens:     entry.outputTokens,
    cost_usd:          costUsd,
    source_identifier: entry.sourceIdentifier ?? null,
    recipe_id:         entry.recipeId ?? null,
  })

  // Non-fatal — a logging failure must never block the import
  if (error) {
    console.error('[ai-logger] Failed to log AI call:', error.message)
  }
}
