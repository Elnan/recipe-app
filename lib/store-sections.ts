export type StoreSection =
  | 'produce' | 'meat' | 'pålegg' | 'bread' | 'frozen'
  | 'pantry'  | 'condiments' | 'dairy'  | 'drinks' | 'snacks' | 'other'

export const STORE_SECTION_ORDER: StoreSection[] = [
  'produce', 'meat', 'pålegg', 'bread', 'frozen',
  'pantry', 'condiments', 'dairy', 'drinks', 'snacks', 'other',
]

export const STORE_SECTION_META: Record<StoreSection, { label: string; emoji: string }> = {
  produce:    { label: 'Frukt & Grønt',         emoji: '🥦' },
  meat:       { label: 'Meat, Chicken & Fish',   emoji: '🥩' },
  pålegg:     { label: 'Pålegg, Cheese & Eggs',  emoji: '🧀' },
  bread:      { label: 'Bread',                  emoji: '🍞' },
  frozen:     { label: 'Frozen',                 emoji: '🧊' },
  pantry:     { label: 'Pantry & Canned',        emoji: '🥫' },
  condiments: { label: 'Spices & Condiments',    emoji: '🧂' },
  dairy:      { label: 'Dairy & Juice',          emoji: '🥛' },
  drinks:     { label: 'Drinks',                 emoji: '🧃' },
  snacks:     { label: 'Snacks & Candy',         emoji: '🍫' },
  other:      { label: 'Other',                  emoji: '🛒' },
}

export const SHOPPING_UNITS = [
  'stk', 'pk', 'g', 'kg', 'ml', 'dl', 'l', 'ts', 'ss', 'boks', 'flaske', 'fedd',
]

// Ingredient name → store section mapping
export const INGREDIENT_SECTION_MAP: Record<string, StoreSection> = {
  // Produce
  løk: 'produce', hvitløk: 'produce', tomat: 'produce', gulrot: 'produce',
  salat: 'produce', paprika: 'produce', sopp: 'produce', brokkoli: 'produce',
  blomkål: 'produce', spinat: 'produce', squash: 'produce', agurk: 'produce',
  potet: 'produce', søtpotet: 'produce', avokado: 'produce', sitron: 'produce',
  lime: 'produce', ingefær: 'produce', chili: 'produce',
  // Meat
  kjøttdeig: 'meat', kyllingfilet: 'meat', kyllinglår: 'meat', kylling: 'meat',
  laks: 'meat', laksefilet: 'meat', torsk: 'meat', bacon: 'meat',
  skinke: 'meat', pølse: 'meat', svinekjøtt: 'meat', lam: 'meat', biff: 'meat',
  // Pålegg
  egg: 'pålegg', ost: 'pålegg', cheddar: 'pålegg', mozzarella: 'pålegg',
  parmesan: 'pålegg', fetaost: 'pålegg', kremost: 'pålegg',
  // Bread
  brød: 'bread', lompe: 'bread', tortilla: 'bread', pitabrød: 'bread',
  // Pantry
  pasta: 'pantry', spaghetti: 'pantry', ris: 'pantry',
  tacoskjell: 'pantry', hermetiske_tomater: 'pantry', kokosmelk: 'pantry',
  // Condiments
  olivenolje: 'condiments', rapsolje: 'condiments', tacokrydder: 'condiments',
  ketchup: 'condiments', sennep: 'condiments', soyasaus: 'condiments',
  tacosaus: 'condiments', salsa: 'condiments', hvitløkspulver: 'condiments',
  // Dairy
  melk: 'dairy', smør: 'dairy', fløte: 'dairy', rømme: 'dairy',
  yoghurt: 'dairy', crème_fraîche: 'dairy', matfløte: 'dairy',
  // Drinks
  juice: 'drinks', appelsinjuice: 'drinks',
  // Snacks
  chips: 'snacks', popcorn: 'snacks', nøtter: 'snacks',
}

// Default amount + unit per ingredient
export const INGREDIENT_DEFAULTS: Record<string, { amount: number; unit: string }> = {
  melk:          { amount: 1,   unit: 'l'    },
  smør:          { amount: 1,   unit: 'pk'   },
  fløte:         { amount: 2,   unit: 'dl'   },
  rømme:         { amount: 2,   unit: 'dl'   },
  yoghurt:       { amount: 1,   unit: 'stk'  },
  egg:           { amount: 1,   unit: 'pk'   },
  ost:           { amount: 1,   unit: 'pk'   },
  cheddar:       { amount: 200, unit: 'g'    },
  brød:          { amount: 1,   unit: 'stk'  },
  kjøttdeig:     { amount: 400, unit: 'g'    },
  kyllingfilet:  { amount: 600, unit: 'g'    },
  laks:          { amount: 400, unit: 'g'    },
  bacon:         { amount: 1,   unit: 'pk'   },
  løk:           { amount: 1,   unit: 'stk'  },
  hvitløk:       { amount: 1,   unit: 'fedd' },
  tomat:         { amount: 2,   unit: 'stk'  },
  pasta:         { amount: 500, unit: 'g'    },
  ris:           { amount: 500, unit: 'g'    },
  tacoskjell:    { amount: 1,   unit: 'pk'   },
  tacokrydder:   { amount: 1,   unit: 'pk'   },
}

export function getIngredientPreset(name: string): {
  section: StoreSection
  amount:  number
  unit:    string
} {
  const key     = name.toLowerCase().trim().replace(/\s+/g, '_')
  const section = INGREDIENT_SECTION_MAP[key] ?? 'other'
  const defaults = INGREDIENT_DEFAULTS[key]
  return {
    section,
    amount: defaults?.amount ?? 1,
    unit:   defaults?.unit   ?? 'stk',
  }
}
