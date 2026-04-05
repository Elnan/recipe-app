/** Shared labels for recipe UI — single source when icons toggle is added */

export const METHOD_LABEL: Record<string, string> = {
  pan: 'Pan',
  oven: 'Oven',
  pot: 'Pot',
  'one-pan': 'One pan',
  grill: 'Grill',
  wok: 'Wok',
  'no-cook': 'No cook',
}

/** Normalised names excluded from “shared ingredient” UI and from bulk add-to-shopping */
export const PANTRY_STAPLES = new Set([
  'salt',
  'pepper',
  'oil',
  'butter',
  'garlic',
  'onion',
  'water',
  'sugar',
  'flour',
  'eggs',
  'egg',
  'milk',
  'cream',
  'stock',
  'broth',
  'tomato paste',
  'soy sauce',
  'vinegar',
  'lemon juice',
  'olive oil',
  'vegetable oil',
  'baking powder',
  'baking soda',
  'cornstarch',
  'honey',
  'mustard',
  'black pepper',
  'white pepper',
  'nøytral olje',
  'hvetemel',
])

export function isPantryStaple(name: string): boolean {
  return PANTRY_STAPLES.has(name.toLowerCase().trim())
}
