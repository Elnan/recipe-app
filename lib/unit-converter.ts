// European units only — no cups, no fahrenheit

// ── Weight: unit → grams ──────────────────────────────────────────────────

const WEIGHT_TO_G: Record<string, number> = {
  g:   1,
  kg:  1000,
  oz:  28.35,
  lb:  453.59,
}

// ── Volume: unit → ml ─────────────────────────────────────────────────────

const VOLUME_TO_ML: Record<string, number> = {
  ml:   1,
  dl:   100,
  l:    1000,
  ts:   5,    // teaspoon (Norwegian)
  ss:   15,   // tablespoon (Norwegian)
  tsp:  5,
  tbsp: 15,
}

// ── Piece units (no conversion) ───────────────────────────────────────────

const PIECE_UNITS = new Set([
  'stk', 'piece', 'pieces', 'slice', 'slices',
  'clove', 'cloves', 'whole', 'medium', 'large', 'small',
])

// ── Converters ────────────────────────────────────────────────────────────

export function toGrams(amount: number, unit: string): number | null {
  const factor = WEIGHT_TO_G[unit.toLowerCase().trim()]
  return factor != null ? amount * factor : null
}

export function toMl(amount: number, unit: string): number | null {
  const factor = VOLUME_TO_ML[unit.toLowerCase().trim()]
  return factor != null ? amount * factor : null
}

export function isPieceUnit(unit: string): boolean {
  return PIECE_UNITS.has(unit.toLowerCase().trim())
}

export function normaliseToBase(
  amount: number,
  unit: string,
): { valueG?: number; valueMl?: number; isCount?: boolean } {
  const g = toGrams(amount, unit)
  if (g != null) return { valueG: g }

  const ml = toMl(amount, unit)
  if (ml != null) return { valueMl: ml }

  if (isPieceUnit(unit)) return { isCount: true }

  return {}
}

// ── Display formatters ────────────────────────────────────────────────────

function dropTrailingZero(n: number, decimals: number): string {
  const s = n.toFixed(decimals)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

export function formatWeight(g: number): string {
  if (g < 1000) return `${Math.round(g)}g`
  return `${dropTrailingZero(g / 1000, 1)}kg`
}

export function formatVolume(ml: number): string {
  if (ml < 15) {
    if (ml % 5 === 0) return `${ml / 5} ts`
    return `${Math.round(ml)}ml`
  }
  if (ml === 15) return '1 ss'
  if (ml === 30) return '2 ss'
  if (ml % 15 === 0 && ml < 100) return `${ml / 15} ss`
  if (ml < 100) return `${Math.round(ml)}ml`
  if (ml < 1000) return `${dropTrailingZero(ml / 100, 1)}dl`
  return `${dropTrailingZero(ml / 1000, 1)}l`
}

export function formatAmount(amount: number, unit: string): string {
  const g = toGrams(amount, unit)
  if (g != null) return formatWeight(g)

  const ml = toMl(amount, unit)
  if (ml != null) return formatVolume(ml)

  // Piece or unknown — just return amount + unit as-is
  const rounded = Number.isInteger(amount) ? amount : +amount.toFixed(2)
  return `${rounded} ${unit}`
}
