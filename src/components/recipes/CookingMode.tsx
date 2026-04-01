'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, RecipeCategory } from '../../../types/recipe'

const CATEGORY_ACCENT: Record<RecipeCategory, string> = {
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

function formatAmount(n: number): string {
  if (n === 0) return '0'
  const whole = Math.floor(n)
  const rem   = n - whole
  const fracs: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'],
    [0.5,   '½'], [0.667, '⅔'], [0.75, '¾'],
  ]
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.04) return whole > 0 ? `${whole}${sym}` : sym
  }
  if (rem < 0.04) return String(whole)
  return parseFloat(n.toFixed(2)).toString()
}

export default function CookingMode({
  recipe,
  scaledServings,
}: {
  recipe:         Recipe
  scaledServings: number
}) {
  const router   = useRouter()
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(true)
  const [animDir, setAnimDir] = useState<'forward' | 'back' | null>(null)
  const [done,    setDone]    = useState(false)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Wake lock — keep screen on while cooking
  useEffect(() => {
    async function acquireWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request('screen') ?? null
      } catch {
        // Not supported or denied — silently continue
      }
    }
    acquireWakeLock()
    return () => { wakeLockRef.current?.release().catch(() => {}) }
  }, [])

  const steps  = recipe.steps.slice().sort((a, b) => a.order - b.order)
  const total  = steps.length
  const scale  = scaledServings / recipe.servings
  const accent = CATEGORY_ACCENT[recipe.category] ?? CATEGORY_ACCENT.other

  function navigate(dir: 'forward' | 'back') {
    if (dir === 'forward' && step === total - 1) {
      setDone(true)
      return
    }
    if (dir === 'back' && step === 0) {
      router.back()
      return
    }
    setAnimDir(dir)
    setVisible(false)
    setTimeout(() => {
      setStep(prev => dir === 'forward' ? prev + 1 : prev - 1)
      setVisible(true)
    }, 180)
  }

  function handleTap(e: React.MouseEvent) {
    navigate(e.clientX > window.innerWidth / 2 ? 'forward' : 'back')
  }

  // Completion screen
  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]"
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        <span className="text-[72px]">🍽️</span>
        <h1
          className="text-[32px] font-bold text-[#f0ede8] text-center px-8"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Enjoy your meal!
        </h1>
        <p
          className="text-[12px] uppercase tracking-[0.1em] text-white/30"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {recipe.title}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-xl border border-white/10 px-6 py-3 text-[13px] text-white/50 transition-colors hover:text-white"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          ← Back to recipe
        </button>
      </div>
    )
  }

  const currentStep = steps[step]
  const stepIngNames = new Set(currentStep?.ingredients_used ?? [])
const stepIngs = recipe.ingredients.filter(ing =>
    [...stepIngNames].some(used => used.toLowerCase() === ing.name.toLowerCase())
  )

  const translateX = visible ? '0px' : animDir === 'forward' ? '-24px' : '24px'

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
      onClick={handleTap}
    >
      {/* ── Top bar ── */}
      <div
        className="shrink-0 pt-4 pb-3"
        onClick={e => e.stopPropagation()}
        style={{ background: 'rgba(10,10,10,0.95)' }}
      >
      <div style={{ maxWidth: 600, margin: '0 auto', paddingLeft: 32, paddingRight: 32 }}>
        {/* Progress bar */}
        <div className="h-[2px] w-full rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%`, background: accent }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-[11px] text-white/30 uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Step {step + 1} of {total}
          </span>
          <button
            onClick={() => router.back()}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors border border-white/10 rounded-lg px-3 py-1"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            ✕ Exit
          </button>
        </div>
      </div>
      </div>

      {/* ── Main content ── */}
      <div
        className="flex-1 flex flex-col justify-center py-6 overflow-hidden"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  `translateX(${translateX})`,
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
      >
      <div style={{ maxWidth: 600, margin: '0 auto', paddingLeft: 32, paddingRight: 32, width: '100%' }}>
        {/* Recipe title */}
        <p
          className="text-[10px] uppercase tracking-[0.1em] text-white/25 mb-6"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {recipe.title}
        </p>

        {/* Step instruction */}
        <p
          className="text-[22px] leading-snug text-[#f0ede8] mb-8"
          style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}
        >
          {currentStep?.instruction}
        </p>

        {/* Ingredient pills */}
        {stepIngs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stepIngs.map(ing => (
              <div
                key={ing.name}
                className="rounded-xl px-3 py-1.5 text-[12px]"
                style={{
                  background:  'rgba(255,255,255,0.07)',
                  border:      '1px solid rgba(255,255,255,0.1)',
                  fontFamily:  'var(--font-geist-mono)',
                  color:       'rgba(255,255,255,0.7)',
                }}
              >
                {ing.name}
                {ing.amount != null && (
                  <span className="ml-1.5 text-white/35">
                    {formatAmount(ing.amount * scale)} {ing.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* ── Bottom tap hint ── */}
      <div
        className="shrink-0 flex items-center justify-between px-8 pb-10 pt-2 pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-geist-mono)', fontSize: 11 }}
      >
        <span>{step > 0 ? '← Prev' : ''}</span>
        <span>{step === total - 1 ? 'Finish →' : 'Next →'}</span>
      </div>
    </div>
  )
}
