'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe } from '../../../types/recipe'

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
  const [isDesktop, setIsDesktop] = useState(false)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768)
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    async function acquireWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request('screen') ?? null
      } catch {
        // Not supported or denied
      }
    }
    acquireWakeLock()
    return () => { wakeLockRef.current?.release().catch(() => {}) }
  }, [])

  const steps  = recipe.steps.slice().sort((a, b) => a.order - b.order)
  const total  = steps.length
  const scale  = scaledServings / recipe.servings

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
    if (isDesktop) return
    navigate(e.clientX > window.innerWidth / 2 ? 'forward' : 'back')
  }

  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
        style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-geist-sans)' }}
      >
        <span className="text-[72px]">🍽️</span>
        <h1
          className="text-[32px] font-bold text-center px-8"
          style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif' }}
        >
          Enjoy your meal!
        </h1>
        <p
          className="text-[12px] uppercase tracking-[0.1em]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          {recipe.title}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 min-h-[44px] rounded-xl border px-6 py-3 text-[13px] transition-opacity hover:opacity-90"
          style={{
            fontFamily:   'var(--font-geist-mono)',
            borderColor:  'var(--color-border)',
            color:        'var(--color-text-dim)',
            background:   'var(--color-surface)',
          }}
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

  function renderIngredientRows(desktop: boolean) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stepIngs.map(ing => (
          <div key={`${currentStep?.order ?? step}-${ing.name}`} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: desktop ? '12px 16px' : '8px 12px',
            borderRadius: desktop ? 12 : 10,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: desktop ? 18 : 12,
              color: 'var(--color-text)',
              flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {ing.name}
            </span>
            {ing.amount != null && (
              <span style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: desktop ? 17 : 11,
                color: 'var(--color-accent)',
                flexShrink: 0, marginLeft: 12,
              }}>
                {formatAmount(ing.amount * scale)} {ing.unit}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--color-bg)' }}
      onClick={handleTap}
    >
      {/* ── Top bar ── */}
      <div
        className="shrink-0 pt-4 pb-3"
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--color-bg)' }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', paddingLeft: 32, paddingRight: 32 }}>
          {/* Progress bar */}
          <div className="h-[3px] w-full rounded-full mb-3" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%`, background: 'var(--color-accent)' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
            >
              Step {step + 1} of {total}
            </span>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-[11px] rounded-lg border px-3 py-1.5 min-h-[36px] transition-opacity hover:opacity-80"
              style={{
                fontFamily:   'var(--font-geist-mono)',
                borderColor:  'var(--color-border)',
                color:        'var(--color-text-dim)',
                background:   'var(--color-surface)',
              }}
            >
              ✕ Exit
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      {isDesktop ? (
        /* Desktop two-column layout */
        <div
          style={{
            flex: 1, display: 'flex',
            padding: '0 48px', overflow: 'hidden',
            paddingTop: 8,
            opacity: visible ? 1 : 0,
            transform: `translateX(${translateX})`,
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {/* Left — instruction */}
          <div style={{ flex: '0 0 58%', paddingRight: 48, overflowY: 'auto', paddingBottom: 40, paddingTop: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--color-text-dim)',
                margin: '0 0 24px',
              }}
            >
              {recipe.title}
            </p>
            <p
              style={{
                fontFamily: 'Georgia, serif', fontSize: 28,
                fontWeight: 400, lineHeight: 1.45,
                color: 'var(--color-text)', margin: 0,
              }}
            >
              {currentStep?.instruction}
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: 1, flexShrink: 0, margin: '0 0 40px', background: 'var(--color-border)' }} />

          {/* Right — ingredients */}
          <div style={{ flex: 1, paddingLeft: 48, overflowY: 'auto', paddingBottom: 40, paddingTop: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--color-text-dim)',
                margin: '0 0 16px',
              }}
            >
              This step
            </p>
            {stepIngs.length > 0 ? renderIngredientRows(true) : (
              <p style={{ color: 'var(--color-text-dim)', fontSize: 13, fontFamily: 'var(--font-geist-sans)' }}>
                No specific ingredients
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Mobile single-column layout */
        <div
          className="flex-1 flex flex-col justify-start overflow-auto"
          style={{
            paddingTop: 8,
            opacity: visible ? 1 : 0,
            transform: `translateX(${translateX})`,
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto', paddingLeft: 32, paddingRight: 32, paddingTop: 24, paddingBottom: 24, width: '100%' }}>
            <p
              className="text-[10px] uppercase tracking-[0.1em] mb-6"
              style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
            >
              {recipe.title}
            </p>

            <p
              className="text-[22px] leading-snug mb-8"
              style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif', fontWeight: 400 }}
            >
              {currentStep?.instruction}
            </p>

            {stepIngs.length > 0 && renderIngredientRows(false)}
          </div>
        </div>
      )}

      {/* ── Bottom navigation ── */}
      {isDesktop ? (
        /* Desktop: explicit buttons + step dots */
        <div
          className="shrink-0 flex items-center justify-between px-12 pb-8 pt-3"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => navigate('back')}
            style={{
              fontFamily: 'var(--font-geist-mono)', fontSize: 13,
              color: step > 0 ? 'var(--color-text-dim)' : 'var(--color-border)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '10px 20px',
              cursor: step > 0 ? 'pointer' : 'default',
            }}
          >
            ← Prev
          </button>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6,
                borderRadius: 999,
                background: i === step
                  ? 'var(--color-accent)'
                  : i < step
                    ? 'rgba(90,107,66,0.4)'
                    : 'var(--color-border)',
                transition: 'all 0.2s ease',
              }} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('forward')}
            style={{
              fontFamily: 'var(--font-geist-mono)', fontSize: 13,
              color: 'var(--color-bg)',
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 10, padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            {step === total - 1 ? 'Finish →' : 'Next →'}
          </button>
        </div>
      ) : (
        /* Mobile: tap hints */
        <div
          className="shrink-0 flex items-center justify-between px-8 pb-10 pt-2 pointer-events-none"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)', fontSize: 11 }}
        >
          <span>{step > 0 ? '← Prev' : ''}</span>
          <span>{step === total - 1 ? 'Finish →' : 'Next →'}</span>
        </div>
      )}
    </div>
  )
}
