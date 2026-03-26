@AGENTS.md

# Recipe App — CLAUDE.md

## Project overview
Next.js recipe management app with Supabase backend. 
Personal use first, potential commercialisation later.

## How to run
- Dev server: `npm run dev`
- Database types: `npx supabase gen types typescript`
- Tests: `npm run test`

## Project structure
- /app — Next.js App Router pages and API routes
- /app/api/parse-recipe — the AI import endpoint
- /components — reusable UI components  
- /lib/supabase.ts — all database queries go here
- /lib/recipe-parser/ — scraping + AI parsing logic
- /types/recipe.ts — the canonical Recipe type (never change without discussion)

## The golden rule of this codebase
The Recipe type in /types/recipe.ts is the contract everything 
is built around. Never bypass it.

## AI cost rules (critical)
- Always try schema.org extraction before calling Claude API
- Use claude-haiku-4 model for all parsing
- Log every AI call to /lib/ai-logger.ts so we can track spend
- Never call AI in a loop — batch where possible

## Database conventions
- All DB queries go through /lib/supabase.ts — never query inline
- Use Row Level Security on all Supabase tables
- Ingredient amounts stored as decimals, units stored separately
- Servings scaling is done client-side (math only, never hits DB)

## UI conventions
- Mobile-first: design for 390px width first
- Cooking mode needs large text (text-2xl minimum for steps)
- Ingredient icons live in /public/icons/ingredients/


## Planned: icon/text toggle for method and dietary badges
- METHOD_META and DIETARY_META in RecipeCard.tsx and FilterDrawer.tsx 
  map each value to { label, icon: null }
- When icons are sourced, fill in the icon slot
- Add a display preference toggle (label / icon / both) in settings
- When ready, extract both constants to /lib/recipe-meta.ts so they 
  are only defined once