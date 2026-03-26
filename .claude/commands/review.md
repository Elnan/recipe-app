# Code Review

Review the specified file or diff against these checklists:

## Recipe type
- [ ] Nothing bypasses `/types/recipe.ts` — no inline type definitions that duplicate or shadow `Recipe`
- [ ] `NewRecipe` used for inserts, not raw `Recipe`

## Database
- [ ] All Supabase queries go through `/lib/supabase.ts` — no inline `createClient` calls
- [ ] Tables use Row Level Security
- [ ] Ingredient amounts are decimals; units are stored as separate strings
- [ ] No DB calls for servings scaling (client-side only)

## AI cost
- [ ] schema.org extraction attempted before any Claude API call
- [ ] Model is `claude-haiku-4` — not opus, not sonnet
- [ ] Every AI call is logged via `/lib/ai-logger.ts`
- [ ] No AI calls inside loops — batched where needed

## UI
- [ ] Mobile-first styles (base styles target 390px)
- [ ] Cooking mode steps use `text-2xl` minimum
- [ ] Ingredient icons sourced from `/public/icons/ingredients/`

Report any violations with file path and line number.
