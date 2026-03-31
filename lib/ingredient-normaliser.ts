const PREPARATION_SUFFIXES = [
  // Norwegian
  'finhakket', 'hakket', 'revet', 'skivet', 'knust',
  // English
  'finely chopped', 'chopped', 'minced', 'grated', 'sliced', 'crushed',
]

const LEADING_QUANTITY_PATTERN =
  /^\d+\s*(cloves?\s+of|fedd\s+av|pinch\s+of|dash\s+of|a\s+pinch\s+of|a\s+dash\s+of)\s+/i

const VARIANTS: Record<string, string> = {
  'garlic cloves':    'garlic',
  'garlic clove':     'garlic',
  'clove of garlic':  'garlic',
  'cloves of garlic': 'garlic',
  'spring onions':    'spring onion',
  'green onions':     'spring onion',
  'green onion':      'spring onion',
  'tomatoes':         'tomat',
  'onions':           'løk',
  'onion':            'løk',
  'carrots':          'gulrot',
  'carrot':           'gulrot',
}

export function extractPreparationNotes(raw: string): string | null {
  const lower = raw.toLowerCase().trim()
  for (const suffix of PREPARATION_SUFFIXES) {
    if (lower.includes(suffix)) return suffix
  }
  return null
}

export function normaliseIngredientName(raw: string): string {
  let name = raw.toLowerCase().trim()

  // Remove leading quantity phrases like "2 cloves of"
  name = name.replace(LEADING_QUANTITY_PATTERN, '')

  // Strip preparation suffixes
  for (const suffix of PREPARATION_SUFFIXES) {
    // Remove suffix whether at end or as a comma-separated descriptor
    name = name.replace(new RegExp(`[,\\s]+${suffix}\\b`, 'i'), '')
    name = name.replace(new RegExp(`\\b${suffix}[,\\s]+`, 'i'), '')
  }

  name = name.trim()

  // Check known variant map
  if (VARIANTS[name]) name = VARIANTS[name]

  // Capitalise first letter
  return name.charAt(0).toUpperCase() + name.slice(1)
}
