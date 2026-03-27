export function formatAmount(n: number): string {
  if (n === 0) return '0'
  const whole = Math.floor(n)
  const rem   = n - whole
  const fracs: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'],
    [0.5, '½'],   [0.667, '⅔'], [0.75, '¾'],
  ]
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.04) return whole > 0 ? `${whole}${sym}` : sym
  }
  if (rem < 0.04) return String(whole)
  return parseFloat(n.toFixed(2)).toString()
}
