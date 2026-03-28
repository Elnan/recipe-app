@AGENTS.md

# Recipe App — CLAUDE.md

## Project overview
Next.js recipe management app with Supabase backend.
Personal use first, potential commercialisation later.

## How to run
- Dev server: `npm run dev`
- Push DB migrations: `npx supabase db push`
- Seed data: `npx tsx scripts/seed-recipes.ts`

## Tech stack
- Framework: Next.js (App Router)
- Database: Supabase (PostgreSQL)
- Styling: Tailwind CSS
- AI parsing: Anthropic API (claude-haiku-4 for cost)
- Hosting: Vercel (free tier)

## Project structure
- /app — Next.js App Router pages and API routes
- /app/recipes — recipe list and detail pages
- /app/api/recipes/import — URL, text, photo import endpoints
- /components/recipes — RecipeCard, RecipeDetail, FilterDrawer, ImportDrawer
- /lib/supabase.ts — Supabase client instance
- /lib/recipes.ts — all DB queries (getRecipes, getRecipe)
- /lib/parsers/ — schema-org.ts and ai-parser.ts
- /lib/ai-logger.ts — logs every AI call to ai_logs table
- /types/recipe.ts — canonical Recipe type (never change without discussion)
- /scripts/seed-recipes.ts — run once with npx tsx

## The golden rule
The Recipe type in /types/recipe.ts is the contract everything
is built around. Never bypass it, never change it without discussion.

## AI cost rules (always follow)
- Use claude-haiku-4 for ALL parsing — never a more expensive model
  without explicit user approval
- Always try schema.org extraction before calling AI for URL imports
- Log every AI call via /lib/ai-logger.ts — never call AI without logging
- Never call AI in a loop — batch where possible
- Cache by source_url — if a URL was imported before, return cached result

## Database conventions
- All DB queries go through /lib/recipes.ts — never query inline in components
- RLS is currently OFF — add policies before going multi-user
- Ingredient amounts stored as decimals, units stored separately
- Servings scaling is client-side only — never hits the DB
- Migrations live in /supabase/migrations/ and are numbered sequentially

## UI conventions
- Mobile-first: design for 390px width first
- Dark theme throughout (#0a0a0a background)
- Tailwind + inline styles hybrid is acceptable
- Spotlight border effect on recipe cards (mouse-tracking radial gradient)
- Category accent colours:
  dinner: #e94560, breakfast: #f4a261, baking: #c77dff,
  dessert: #48cae4, other: #52b788

## How we work
- Plan before building: confirm file list and architecture before writing code
- Pause after each file — print the absolute path only when ready for review
  (e.g. "Ready for review: /Users/olavelnan/Documents/dev/recipe-app/lib/ai-logger.ts")
  and wait for approval. Always use absolute paths so files are clickable in Cursor.
  (e.g. "Ready for review: /lib/ai-logger.ts") and wait for approval
- Never add features not in the approved spec
- Follow AI cost rules on every task that touches parsing code
- Run /checkpoint at the end of each feature to commit and push

## External APIs
- Kassal.app — Norwegian grocery product data (package sizes, prices)
  - Base URL: https://kassal.app/api/v1
  - Auth: Bearer token in Authorization header
  - Key: stored in KASSAL_API_KEY env var
  - Rate limit: 60 req/min (free tier)
  - Use for: ingredient package size lookup (weight + weight_unit)
  - Never call from client-side — server-side only (API routes)
  - Cache results — never call Kassalapp twice for the same ingredient name

## Planned: icon/text toggle for method and dietary badges
- METHOD_META and DIETARY_META in RecipeCard.tsx and FilterDrawer.tsx
  map each value to { label, icon: null }
- When icons are sourced, fill in the icon slot
- Add a display preference toggle (label / icon / both) in settings
- When ready, extract both constants to /lib/recipe-meta.ts so they
  are only defined once

## Planned features (post-launch)
- Icon/text toggle for method and dietary badges (see above)
- "What's in my fridge" ingredient filter (requires user ingredient list)
- RLS in Supabase when real users are added
- Vercel preview deployments before launch
- dev/main branch split when on production

## LESSON log
| # | Lesson | Feature |
|---|--------|---------|
| 1 | Always pause for approval after each file | F1 |
| 2 | Use .every() not .some() for dietary filter matching | F1 |
| 3 | max_time_minutes is computed (prep+cook), filter client-side | F1 |
| 4 | params is a Promise in Next.js 15 App Router | F1 |
| 5 | METHOD_META/DIETARY_META duplicated in RecipeCard + FilterDrawer — extract to /lib/recipe-meta.ts when icons added | F1 |
| 6 | Show file path only for review, not code in terminal | F2 |
| 7 | Fixed bottom bars need bottom: 64 not bottom: 0 to clear the BottomNav | F3a |
| 8 | All Anthropic client instantiations should pass apiKey: process.env.ANTHROPIC_API_KEY explicitly | F3a |
| 9 | Seed recipes must have protein_type set for menu features to work | F3a |


