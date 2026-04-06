'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, NewRecipe, RecipeCategory } from '../../../types/recipe'
import RecipeEdit from './RecipeEdit'
import { RecipeIcon } from '../../../lib/recipe-icons'
import { METHOD_LABEL } from '@/lib/recipe-meta'

const CATEGORY_ACCENT: Record<RecipeCategory, string> = {
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  dinner: '🍽️', breakfast: '☀️', baking: '🍞', dessert: '🍮', other: '🥄',
}

const PROTEIN_LABEL: Record<string, string> = {
  kjott: 'Kjøtt', kylling: 'Kylling', fisk: 'Fisk', vegetar: 'Vegetar',
}

const DIETARY_META: Record<string, { label: string; icon: null }> = {
  vegetarian:    { label: 'Vegetarian',  icon: null },
  vegan:         { label: 'Vegan',       icon: null },
  'gluten-free': { label: 'Gluten free', icon: null },
  'dairy-free':  { label: 'Dairy free',  icon: null },
  'nut-free':    { label: 'Nut free',    icon: null },
}

function formatTime(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}t ${m}m` : `${h}t`
  }
  return `${mins}m`
}

function formatAmount(n: number): string {
  if (n === 0) return '0'
  const whole = Math.floor(n)
  const rem = n - whole
  const fracs: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'],
    [0.5, '½'],   [0.667, '⅔'], [0.75, '¾'],
  ]
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.04) {
      return whole > 0 ? `${whole}${sym}` : sym
    }
  }
  if (rem < 0.04) return String(whole)
  return parseFloat(n.toFixed(2)).toString()
}

interface RecipeDetailProps {
  recipe:            Recipe
  onRecipeUpdate?:   (updated: Recipe) => void
  /** When set (e.g. embedded in menus), Back / post-delete navigate here instead of router.back() */
  onBack?:           () => void
}

export default function RecipeDetail({ recipe, onRecipeUpdate, onBack }: RecipeDetailProps) {
  const router = useRouter()
  const [isEditing,       setIsEditing]       = useState(false)
  const [currentRecipe,   setCurrentRecipe]   = useState(recipe)
  const [scaledServings,  setScaledServings]  = useState(currentRecipe.servings)
  const [activeTab,       setActiveTab]       = useState<'ingredients' | 'steps'>('ingredients')
  const [expandedStep,    setExpandedStep]    = useState<number | null>(null)
  const [addingToList,    setAddingToList]    = useState(false)
  const [shoppingToast,   setShoppingToast]   = useState(false)
  const [descExpanded,    setDescExpanded]    = useState(false)

  async function handleAddToShoppingList() {
    setAddingToList(true)
    try {
      await fetch(`/api/shopping/recipe/${currentRecipe.id}`, { method: 'POST' })
      setShoppingToast(true)
      setTimeout(() => setShoppingToast(false), 2500)
    } finally {
      setAddingToList(false)
    }
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <RecipeEdit
        recipe={currentRecipe}
        onCancel={() => setIsEditing(false)}
        onSave={async (updates: Partial<NewRecipe>) => {
          const res = await fetch(`/api/recipes/${currentRecipe.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(updates),
          })
          if (res.ok) {
            const { recipe: updated } = await res.json()
            setCurrentRecipe(updated)
            onRecipeUpdate?.(updated)
            router.refresh()
            setIsEditing(false)
          }
        }}
        onDelete={async () => {
          await fetch(`/api/recipes/${currentRecipe.id}`, { method: 'DELETE' })
          if (onBack) onBack()
          else router.back()
        }}
      />
    )
  }

  const scale = scaledServings / currentRecipe.servings
  const accent = CATEGORY_ACCENT[currentRecipe.category] ?? CATEGORY_ACCENT.other
  const totalTime = (currentRecipe.prep_time_minutes ?? 0) + (currentRecipe.cook_time_minutes ?? 0)
  const methodDisplay = currentRecipe.cooking_method
    ?.split(',')
    .map(m => METHOD_LABEL[m.trim()] ?? m.trim())
    .join(' · ')
  const hasHeroPhoto = !!currentRecipe.image_url

  // Ingredient names used in the currently expanded step
  const stepIngredients = expandedStep != null
    ? new Set(currentRecipe.steps.find(s => s.order === expandedStep)?.ingredients_used ?? [])
    : null

  function adjustServings(delta: number) {
    setScaledServings(prev => Math.max(1, prev + delta))
  }

  function toggleStep(order: number) {
    setExpandedStep(prev => (prev === order ? null : order))
  }

  return (
    <div className="min-h-screen pb-40" style={{ background: 'var(--color-bg)' }}>

      {/* ── Hero ── */}
      <div className="relative h-72 overflow-hidden">
        {currentRecipe.image_url ? (
          <div className="absolute inset-0" style={{ background: '#1a0508' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentRecipe.image_url}
              alt={currentRecipe.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : currentRecipe.image_icon ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--color-subtle)' }}
          >
            <RecipeIcon icon={currentRecipe.image_icon} color={accent} size={80} />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--color-subtle)' }}
          >
            <span className="text-[80px] opacity-20" style={{ color: 'var(--color-text-dim)' }}>{CATEGORY_EMOJI[currentRecipe.category]}</span>
          </div>
        )}

        {hasHeroPhoto && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.38) 48%, rgba(0,0,0,0.93) 100%)',
            }}
          />
        )}

        {/* Back button */}
        <button
          onClick={() => { if (onBack) onBack(); else router.back() }}
          className="absolute left-4 top-4 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/70 hover:text-white transition-colors"
          style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          ← Back
        </button>

        {/* Edit button */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute right-4 top-4 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/70 hover:text-white transition-colors"
          style={{
            background:     'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            fontFamily:     'var(--font-geist-mono)',
          }}
        >
          Edit
        </button>

        {/* Category + rating row, then title */}
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center justify-between mb-2">
            <span
              className="rounded-[5px] px-[9px] py-[3px] text-[9px] font-medium uppercase tracking-[0.09em]"
              style={{ color: 'var(--color-bg)', background: accent, fontFamily: 'var(--font-geist-mono)' }}
            >
              {CATEGORY_EMOJI[currentRecipe.category]} {currentRecipe.category}
            </span>
            {currentRecipe.rating != null && (
              <div style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '3px 6px',
                display: 'flex',
                gap: 1,
              }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{
                    fontSize: 10,
                    color: i <= currentRecipe.rating! ? '#f0b429' : 'rgba(255,255,255,0.2)',
                  }}>★</span>
                ))}
              </div>
            )}
          </div>
          <h1
            className="text-[26px] font-bold leading-tight"
            style={{
              fontFamily: 'Georgia, serif',
              color: hasHeroPhoto ? '#fff' : 'var(--color-text)',
              textShadow: hasHeroPhoto ? '0 2px 8px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            {currentRecipe.title}
          </h1>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-2xl px-5">

        {/* Description — first element below hero */}
        {currentRecipe.description && (
          <div className="mt-5">
            <p
              className="text-[14px] leading-relaxed"
              style={{
                color: 'var(--color-text-dim)',
                fontFamily: 'var(--font-geist-sans)',
                display: '-webkit-box',
                WebkitLineClamp: descExpanded ? undefined : 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: descExpanded ? 'visible' : 'hidden',
              }}
            >
              {currentRecipe.description}
            </p>
            {currentRecipe.description.length > 250 && (
              <button
                onClick={() => setDescExpanded(e => !e)}
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: 10,
                  color: accent,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  marginTop: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {descExpanded ? 'Read less ↑' : 'Read more ↓'}
              </button>
            )}
          </div>
        )}

        {/* Dietary pills */}
        {currentRecipe.dietary && currentRecipe.dietary.length > 0 && (
          <div className="flex flex-wrap gap-[5px] mt-4">
            {currentRecipe.dietary.map(d => (
              <div
                key={d}
                className="uppercase tracking-[0.07em] border"
                style={{
                  fontFamily:  'var(--font-geist-mono)',
                  fontSize:    '11px',
                  padding:     '3px 10px',
                  background:  'transparent',
                  borderColor: 'var(--color-border)',
                  color:       'var(--color-text-dim)',
                  borderRadius: '20px',
                }}
              >
                {DIETARY_META[d]?.label ?? d}
              </div>
            ))}
          </div>
        )}

        {/* Method | Protein row */}
        {(currentRecipe.cooking_method || currentRecipe.protein_type) && (
          <div
            className="mt-5"
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {currentRecipe.cooking_method && (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '9px 20px' }}>
                <span
                  className="text-[10px] uppercase tracking-[0.08em] shrink-0"
                  style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                >
                  Method
                </span>
                <span
                  className="text-[13px] min-w-0"
                  style={{
                    color:         'var(--color-text)',
                    fontFamily:    'var(--font-geist-sans)',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                    textAlign:     'right',
                  }}
                  title={methodDisplay}
                >
                  {methodDisplay}
                </span>
              </div>
            )}
            {currentRecipe.cooking_method && currentRecipe.protein_type && (
              <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
            )}
            {currentRecipe.protein_type && (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '9px 20px' }}>
                <span
                  className="text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                >
                  Protein
                </span>
                <span
                  className="text-[13px]"
                  style={{ fontFamily: 'var(--font-geist-sans)', color: accent }}
                >
                  {PROTEIN_LABEL[currentRecipe.protein_type] ?? currentRecipe.protein_type}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total time | Servings row */}
        <div
          className="mt-3 flex items-center rounded-2xl border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          {totalTime > 0 && (
            <div className="flex-1 flex flex-col items-center py-4">
              <span
                className="text-[10px] uppercase tracking-[0.08em] mb-1"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
              >
                Total time
              </span>
              <span className="text-[22px]" style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif' }}>
                {formatTime(totalTime)}
              </span>
            </div>
          )}
          {totalTime > 0 && (
            <div className="shrink-0" style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
          )}
          <div className="flex-1 flex flex-col items-center py-4">
            <span
                className="text-[10px] uppercase tracking-[0.08em] mb-1"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
              >
                Servings
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustServings(-1)}
                disabled={scaledServings <= 1}
                className="flex items-center justify-center rounded-lg transition-colors disabled:opacity-20"
                style={{ width: 22, height: 22, background: 'var(--color-border)', color: 'var(--color-text-dim)' }}
                aria-label="Decrease servings"
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>−</span>
              </button>
              <span
                className="text-[22px]"
                style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif', minWidth: 20, textAlign: 'center' as const }}
              >
                {scaledServings}
              </span>
              <button
                onClick={() => adjustServings(1)}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{ width: 22, height: 22, background: 'var(--color-border)', color: 'var(--color-text-dim)' }}
                aria-label="Increase servings"
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className="mt-6 flex gap-1 rounded-xl p-1" style={{ background: 'var(--color-surface)' }}>
          {(['ingredients', 'steps'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-lg py-2 text-[12px] uppercase tracking-[0.07em] transition-colors"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                background: activeTab === tab ? accent : 'transparent',
                color: activeTab === tab ? 'var(--color-bg)' : 'var(--color-text-dim)',
                fontWeight: activeTab === tab ? 600 : 400,
              }}
            >
              {tab === 'ingredients'
                ? `Ingredients (${currentRecipe.ingredients.length})`
                : `Steps (${currentRecipe.steps.length})`}
            </button>
          ))}
        </div>

        {/* ── Ingredients tab ── */}
        {activeTab === 'ingredients' && (
          <>
          {expandedStep != null && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className="text-[10px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
              >
                ● Step {String(expandedStep).padStart(2, '0')} highlighted
              </span>
              <button
                onClick={() => setExpandedStep(null)}
                className="text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                clear ×
              </button>
            </div>
          )}
          <ul className="mt-4 space-y-1">
            {currentRecipe.ingredients.map((ing, i) => {
              const highlighted = stepIngredients?.has(ing.name)
              return (
                <li
                  key={`ing-${i}`}
                  className="flex items-baseline justify-between rounded-xl px-4 py-3 transition-colors"
                  style={{
                    background: highlighted
                      ? `${accent}18`
                      : 'var(--color-surface)',
                    borderLeft: highlighted ? `2px solid ${accent}` : '2px solid transparent',
                  }}
                >
                  <span
                    className="text-[14px]"
                    style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                  >
                    {ing.name}
                    {ing.notes && (
                      <span className="ml-1.5 text-[12px]" style={{ color: 'var(--color-text-dim)' }}>{ing.notes}</span>
                    )}
                  </span>
                  <span
                    className="ml-4 shrink-0 text-[13px]"
                    style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {formatAmount(ing.amount * scale)} {ing.unit}
                  </span>
                </li>
              )
            })}
          </ul>
          </>
        )}

        {/* ── Steps tab ── */}
        {activeTab === 'steps' && (
          <ol className="mt-4 space-y-2">
            {currentRecipe.steps.map(step => {
              const isExpanded = expandedStep === step.order
              const stepIngs = currentRecipe.ingredients.filter(ing =>
                step.ingredients_used.includes(ing.name)
              )

              return (
                <li key={step.order}>
                  <button
                    onClick={() => toggleStep(step.order)}
                    className="w-full rounded-2xl border px-5 py-4 text-left transition-colors"
                    style={{
                      background: isExpanded
                        ? `${accent}10`
                        : 'var(--color-surface)',
                      borderColor: isExpanded ? `${accent}40` : 'var(--color-border)',
                    }}
                  >
                    {/* Step header */}
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 shrink-0 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          fontFamily: 'var(--font-geist-mono)',
                          color: isExpanded ? accent : 'var(--color-text-dim)',
                        }}
                      >
                        {String(step.order).padStart(2, '0')}
                      </span>
                      <p
                        className="text-[14px] leading-snug"
                        style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                      >
                        {step.instruction}
                      </p>
                    </div>

                    {/* Collapsed: ingredient pills */}
                    {!isExpanded && stepIngs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pl-8">
                        {stepIngs.map(ing => (
                          <span
                            key={`${step.order}-${ing.name}`}
                            className="rounded-full border px-2.5 py-0.5 text-[10px]"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                          >
                            {ing.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded: scaled ingredient table */}
                    {isExpanded && stepIngs.length > 0 && (
                      <div className="mt-4 pl-8">
                        <table className="w-full">
                          <tbody>
                            {stepIngs.map(ing => (
                              <tr key={`${step.order}-${ing.name}`} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <td
                                  className="py-2 text-[13px]"
                                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                                >
                                  {ing.name}
                                </td>
                                <td
                                  className="py-2 text-right text-[12px]"
                                  style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                                >
                                  {formatAmount(ing.amount * scale)} {ing.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* ── Sticky bottom button ── */}
      <div
        className="fixed left-0 right-0 px-5 pb-8 pt-4"
        style={{
          bottom:     64,
          background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)',
        }}
      >
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-3">
          <button
            onClick={() => router.push(`/recipes/${currentRecipe.id}/cook?servings=${scaledServings}`)}
            className="w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] transition-opacity hover:opacity-90"
            style={{ color: 'var(--color-bg)', background: 'var(--color-accent)', fontFamily: 'var(--font-geist-mono)' }}
          >
            Start cooking → {scaledServings} {scaledServings === 1 ? 'serving' : 'servings'}
          </button>
          <button
            onClick={handleAddToShoppingList}
            disabled={addingToList}
            className="text-[11px] tracking-[0.04em] transition-opacity hover:opacity-80"
            style={{
              fontFamily:          'var(--font-geist-mono)',
              color:               'var(--color-text-dim)',
              opacity:             addingToList ? 0.4 : 1,
              background:          'none',
              border:              'none',
              textDecoration:      'underline',
              textUnderlineOffset: '3px',
              cursor:              addingToList ? 'default' : 'pointer',
            }}
          >
            {addingToList ? 'Adding…' : 'Add to shopping list'}
          </button>
        </div>

        {/* Toast */}
        {shoppingToast && (
          <div
            className="fixed left-1/2 -translate-x-1/2 rounded-xl px-5 py-2.5 text-[13px] z-50 whitespace-nowrap"
            style={{ color: 'var(--color-text)', bottom: 80, background: 'rgba(30,30,30,0.95)', border: '1px solid var(--color-border)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', fontFamily: 'var(--font-geist-sans)' }}
          >
            Ingredients added ✓
          </div>
        )}
      </div>
    </div>
  )
}
