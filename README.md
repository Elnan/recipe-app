# Matinn

A personal recipe management app with AI-powered import, weekly menu planning, and smart shopping lists. Built with Next.js, Supabase, and the Anthropic API.

## Features

- **Recipe library** — Browse, search, and filter recipes by category, cooking method, dietary tags, protein type, and max cooking time.
- **AI-powered import** — Import recipes from a URL (tries schema.org extraction first, falls back to AI), pasted text, or a photo of a recipe.
- **Recipe detail & editing** — Full ingredient list with servings scaling, step-by-step instructions, image uploads, and inline editing.
- **Cooking mode** — Distraction-free step-by-step view for following a recipe while cooking.
- **Weekly menus** — Build 4-recipe weekly menus manually or get AI-generated suggestions based on your library.
- **Shopping lists** — Generate aggregated shopping lists from a recipe or an entire menu, with store-section grouping and manual items.
- **Ingredient product lookup** — Background lookup via Kassal.app for Norwegian grocery product data (package sizes, prices).
- **PWA** — Installable as a standalone app on mobile with share-target support (share a URL from your browser to import it).
- **Dark & light theme** — Toggle between themes, persisted in `localStorage`.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| AI | [Anthropic API](https://docs.anthropic.com/) (Claude Haiku for cost efficiency) |
| Validation | [Zod 4](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Hosting | [Vercel](https://vercel.com/) |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- An [Anthropic API](https://console.anthropic.com/) key
- (Optional) A [Kassal.app](https://kassal.app/) API key for ingredient product lookup

### Environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
KASSAL_API_KEY=your-kassal-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Install and run

```bash
# Install dependencies
npm install

# Push database schema to Supabase
npx supabase db push

# Seed sample recipes (optional, run once)
npx tsx scripts/seed-recipes.ts

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to `/recipes`.

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Redirects to /recipes
│   ├── layout.tsx                # Root layout (fonts, theme, PWA, BottomNav)
│   ├── recipes/
│   │   ├── page.tsx              # Recipe list with filters and import
│   │   └── [id]/
│   │       ├── page.tsx          # Recipe detail and editing
│   │       └── cook/page.tsx     # Cooking mode
│   ├── menus/page.tsx            # Weekly menu builder
│   ├── shopping/page.tsx         # Shopping list
│   ├── share/page.tsx            # PWA share-target handler
│   └── api/
│       ├── recipes/              # CRUD + image upload
│       │   └── import/           # URL, text, and photo import
│       ├── menus/                # CRUD + AI suggestions
│       ├── shopping/             # List management
│       └── ingredients/          # Product lookup + section assignment
├── components/
│   ├── recipes/                  # RecipeCard, RecipeDetail, RecipeEdit,
│   │                             # FilterDrawer, ImportDrawer, CookingMode
│   ├── menus/                    # MenuBuilder, MenuDetail
│   ├── layout/                   # BottomNav
│   └── ui/                       # ThemeToggle
└── lib/                          # Client helpers (theme, recipe-meta)

lib/                              # Server/data layer
├── supabase.ts                   # Supabase client
├── recipes.ts                    # All recipe DB queries
├── menus.ts                      # Menu DB queries
├── shopping.ts                   # Shopping list DB queries
├── storage.ts                    # Image uploads (Supabase Storage)
├── kassal.ts                     # Kassal.app integration
├── ai-logger.ts                  # AI usage/cost logging
└── parsers/
    ├── schema-org.ts             # Schema.org recipe extraction
    ├── ai-parser.ts              # Anthropic-based recipe parsing
    └── map-recipe.ts             # Normalize parsed data to Recipe type

types/
└── recipe.ts                     # Canonical Recipe and Menu types

supabase/
└── migrations/                   # Numbered SQL migrations

scripts/
└── seed-recipes.ts               # Seed sample data
```

## Database

Schema is managed via sequential migrations in `supabase/migrations/`. Key tables:

| Table | Purpose |
|-------|---------|
| `recipes` | Core recipe data (ingredients/steps as JSONB, category, times, tags) |
| `menus` | Weekly menus with week/year tracking |
| `menu_recipes` | Join table linking menus to recipes (positions 1–4) |
| `shopping_list_items` | Shopping items with optional recipe/menu source tracking |
| `ingredient_products` | Cached product data from Kassal.app (package sizes, prices) |
| `ai_logs` | Logged AI calls with model, token counts, and cost |

Push schema changes with:

```bash
npx supabase db push
```

## AI cost controls

The app is designed to minimise AI spend:

- All parsing uses **Claude Haiku** — never a more expensive model without explicit approval.
- URL imports try **schema.org extraction first** and only fall back to AI when structured data isn't available.
- Every AI call is logged to the `ai_logs` table via `lib/ai-logger.ts`.
- Results are **cached by `source_url`** — re-importing the same URL returns the cached recipe.
- AI is never called in a loop — inputs are batched where possible.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx supabase db push` | Push migrations to Supabase |
| `npx tsx scripts/seed-recipes.ts` | Seed sample recipes |

## License

Private — not open source.
