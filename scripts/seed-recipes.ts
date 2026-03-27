// Seed script — run with: npx tsx scripts/seed-recipes.ts
// (ts-node won't work here — the tsconfig uses moduleResolution: "bundler")

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { NewRecipe } from '../types/recipe'

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const eq = line.indexOf('=')
    if (eq === -1 || line.startsWith('#')) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim()
    if (key) process.env[key] = val
  }
} catch {
  console.warn('Could not load .env.local — falling back to existing env vars')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ── Seed data ────────────────────────────────────────────────────────────────
const recipes: NewRecipe[] = [
  // 1. Dinner — pan
  {
    title: 'Chicken Thighs with Garlic & Lemon',
    description: 'Crispy pan-seared chicken thighs finished with a bright garlic and lemon pan sauce.',
    category: 'dinner',
    cooking_method: 'pan',
    cuisine: 'French',
    rating: 5,
    servings: 4,
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    dietary: [],
    tags: ['chicken', 'quick', 'weeknight'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'chicken thighs', amount: 4, unit: 'pieces', notes: 'bone-in, skin-on' },
      { name: 'garlic cloves', amount: 4, unit: 'cloves', notes: 'thinly sliced' },
      { name: 'lemon', amount: 1, unit: 'whole', notes: 'zested and juiced' },
      { name: 'chicken stock', amount: 0.5, unit: 'cup' },
      { name: 'butter', amount: 1, unit: 'tbsp' },
      { name: 'fresh thyme', amount: 4, unit: 'sprigs' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Pat chicken thighs dry and season generously with salt and pepper on both sides.',
        ingredients_used: ['chicken thighs'],
      },
      {
        order: 2,
        instruction: 'Heat an oven-safe pan over medium-high heat. Place chicken skin-side down and cook undisturbed for 12–14 minutes until the skin is deep golden and releases easily.',
        ingredients_used: ['chicken thighs'],
      },
      {
        order: 3,
        instruction: 'Flip the chicken, add garlic, thyme, and cook for 2 minutes. Pour in stock, add lemon juice and zest, and simmer for 10 minutes until cooked through. Finish with butter.',
        ingredients_used: ['garlic cloves', 'fresh thyme', 'chicken stock', 'lemon', 'butter'],
      },
    ],
  },

  // 2. Dinner — pot
  {
    title: 'Ribollita',
    description: 'Hearty Tuscan bread and bean soup. Thick, warming, and better the next day.',
    category: 'dinner',
    cooking_method: 'pot',
    cuisine: 'Italian',
    rating: 4,
    servings: 6,
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    dietary: ['vegetarian'],
    tags: ['soup', 'beans', 'bread', 'vegetarian'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'cannellini beans', amount: 400, unit: 'g', notes: 'cooked or canned, drained' },
      { name: 'cavolo nero', amount: 200, unit: 'g', notes: 'stems removed, roughly chopped' },
      { name: 'day-old sourdough', amount: 150, unit: 'g', notes: 'torn into chunks' },
      { name: 'canned tomatoes', amount: 400, unit: 'g' },
      { name: 'onion', amount: 1, unit: 'medium', notes: 'finely diced' },
      { name: 'garlic cloves', amount: 3, unit: 'cloves', notes: 'crushed' },
      { name: 'olive oil', amount: 3, unit: 'tbsp' },
      { name: 'vegetable stock', amount: 1, unit: 'litre' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Heat olive oil in a large pot over medium heat. Sauté onion for 8 minutes until soft, then add garlic and cook for 1 minute.',
        ingredients_used: ['olive oil', 'onion', 'garlic cloves'],
      },
      {
        order: 2,
        instruction: 'Add canned tomatoes and cook for 5 minutes. Add stock, cannellini beans, and cavolo nero. Simmer for 25 minutes.',
        ingredients_used: ['canned tomatoes', 'vegetable stock', 'cannellini beans', 'cavolo nero'],
      },
      {
        order: 3,
        instruction: 'Stir in the torn sourdough so it absorbs the broth and thickens the soup. Simmer for a further 10 minutes. Season and serve with a drizzle of olive oil.',
        ingredients_used: ['day-old sourdough', 'olive oil'],
      },
    ],
  },

  // 3. Breakfast — one-pan
  {
    title: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato and pepper sauce. One pan, ten minutes.',
    category: 'breakfast',
    cooking_method: 'one-pan',
    cuisine: 'Middle Eastern',
    rating: 5,
    servings: 2,
    prep_time_minutes: 5,
    cook_time_minutes: 20,
    dietary: ['vegetarian', 'gluten-free'],
    tags: ['eggs', 'vegetarian', 'gluten-free', 'spicy'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'eggs', amount: 4, unit: 'large' },
      { name: 'canned tomatoes', amount: 400, unit: 'g', notes: 'crushed' },
      { name: 'red pepper', amount: 1, unit: 'large', notes: 'thinly sliced' },
      { name: 'onion', amount: 1, unit: 'medium', notes: 'finely sliced' },
      { name: 'garlic cloves', amount: 2, unit: 'cloves', notes: 'crushed' },
      { name: 'cumin', amount: 1, unit: 'tsp' },
      { name: 'smoked paprika', amount: 1, unit: 'tsp' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Heat olive oil in a wide pan over medium heat. Add onion and red pepper and cook for 8 minutes until softened. Add garlic, cumin, and paprika and stir for 1 minute.',
        ingredients_used: ['olive oil', 'onion', 'red pepper', 'garlic cloves', 'cumin', 'smoked paprika'],
      },
      {
        order: 2,
        instruction: 'Pour in the crushed tomatoes, season with salt, and simmer for 8 minutes until the sauce thickens slightly.',
        ingredients_used: ['canned tomatoes'],
      },
      {
        order: 3,
        instruction: 'Make 4 wells in the sauce and crack an egg into each. Cover and cook for 4–5 minutes until the whites are set but yolks are still runny.',
        ingredients_used: ['eggs'],
      },
    ],
  },

  // 4. Baking — oven
  {
    title: 'Brown Butter Banana Bread',
    description: 'Deeply flavoured banana bread made with browned butter and a hint of cardamom.',
    category: 'baking',
    cooking_method: 'oven',
    cuisine: 'American',
    rating: 4,
    servings: 10,
    prep_time_minutes: 20,
    cook_time_minutes: 60,
    dietary: ['vegetarian'],
    tags: ['banana', 'baking', 'snack', 'vegetarian'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'ripe bananas', amount: 3, unit: 'large', notes: 'well mashed' },
      { name: 'butter', amount: 115, unit: 'g', notes: 'browned and cooled' },
      { name: 'brown sugar', amount: 150, unit: 'g' },
      { name: 'eggs', amount: 2, unit: 'large' },
      { name: 'plain flour', amount: 190, unit: 'g' },
      { name: 'baking soda', amount: 1, unit: 'tsp' },
      { name: 'ground cardamom', amount: 0.5, unit: 'tsp' },
      { name: 'salt', amount: 0.5, unit: 'tsp' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Preheat oven to 175°C. Melt butter in a saucepan over medium heat, swirling until it turns golden and smells nutty, about 5 minutes. Cool slightly.',
        ingredients_used: ['butter'],
      },
      {
        order: 2,
        instruction: 'Whisk together browned butter and brown sugar. Beat in eggs, then fold in the mashed bananas.',
        ingredients_used: ['butter', 'brown sugar', 'eggs', 'ripe bananas'],
      },
      {
        order: 3,
        instruction: 'Fold in flour, baking soda, cardamom, and salt until just combined — do not overmix. Pour into a greased 23×13cm loaf tin and bake for 55–60 minutes until a skewer comes out clean.',
        ingredients_used: ['plain flour', 'baking soda', 'ground cardamom', 'salt'],
      },
    ],
  },

  // 5. Dessert — no-cook
  {
    title: 'Lemon Posset',
    description: 'A three-ingredient set cream dessert with an intense lemon flavour. No gelatine needed.',
    category: 'dessert',
    cooking_method: 'no-cook',
    cuisine: 'British',
    rating: 5,
    servings: 4,
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    dietary: ['vegetarian', 'gluten-free'],
    tags: ['lemon', 'cream', 'no-gelatine', 'vegetarian', 'gluten-free'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'double cream', amount: 600, unit: 'ml' },
      { name: 'caster sugar', amount: 150, unit: 'g' },
      { name: 'lemons', amount: 3, unit: 'whole', notes: 'zested and juiced (approx. 100ml juice)' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Combine double cream and caster sugar in a saucepan. Bring to a boil over medium heat, stirring to dissolve the sugar, then boil for exactly 3 minutes.',
        ingredients_used: ['double cream', 'caster sugar'],
      },
      {
        order: 2,
        instruction: 'Remove from heat. Stir in lemon juice and zest. The mixture will thicken slightly.',
        ingredients_used: ['lemons'],
      },
      {
        order: 3,
        instruction: 'Pour into 4 serving glasses or ramekins and refrigerate for at least 3 hours until set. Serve cold.',
        ingredients_used: ['double cream', 'caster sugar', 'lemons'],
      },
    ],
  },

  // 6. Other — oven
  {
    title: 'Harissa Roasted Chickpeas',
    description: 'Crispy spiced chickpeas that work as a snack, salad topping, or side dish.',
    category: 'other',
    cooking_method: 'oven',
    cuisine: 'North African',
    rating: 4,
    servings: 4,
    prep_time_minutes: 5,
    cook_time_minutes: 30,
    dietary: ['vegan', 'gluten-free'],
    tags: ['chickpeas', 'snack', 'vegan', 'gluten-free', 'spicy'],
    image_url: undefined,
    source_url: undefined,
    ingredients: [
      { name: 'chickpeas', amount: 400, unit: 'g', notes: 'canned, drained and thoroughly dried' },
      { name: 'harissa paste', amount: 2, unit: 'tbsp' },
      { name: 'olive oil', amount: 2, unit: 'tbsp' },
      { name: 'smoked paprika', amount: 0.5, unit: 'tsp' },
      { name: 'salt', amount: 0.5, unit: 'tsp' },
    ],
    steps: [
      {
        order: 1,
        instruction: 'Preheat oven to 210°C. Spread dried chickpeas on a baking tray in a single layer. Roast for 15 minutes until starting to crisp.',
        ingredients_used: ['chickpeas'],
      },
      {
        order: 2,
        instruction: 'Toss the hot chickpeas with harissa paste, olive oil, smoked paprika, and salt until well coated.',
        ingredients_used: ['harissa paste', 'olive oil', 'smoked paprika', 'salt'],
      },
      {
        order: 3,
        instruction: 'Return to the oven for a further 12–15 minutes, shaking the tray halfway, until deep red and crispy. Cool on the tray — they crisp further as they cool.',
        ingredients_used: ['chickpeas'],
      },
    ],
  },
]

// ── Insert ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${recipes.length} recipes…\n`)

  for (const recipe of recipes) {
    const { error } = await supabase.from('recipes').insert(recipe)
    if (error) {
      console.error(`✗ ${recipe.title}:`, error.message)
    } else {
      console.log(`✓ ${recipe.title}`)
    }
  }

  console.log('\nDone.')
}

seed()
