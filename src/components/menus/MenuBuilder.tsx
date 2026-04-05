'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Recipe } from '../../../types/recipe'

type Step = 'anchor' | 'generating' | 'review' | 'swap'
type ProteinType = 'kjott' | 'kylling' | 'fisk' | 'vegetar'

interface SaveData {
  name: string
  recipes: Recipe[]
  dominant_protein?: ProteinType
}

interface Props {
  dinnerRecipes: Recipe[]
  initialRecipes: Recipe[]
  initialName: string
  onSave: (data: SaveData) => void
  onCancel: () => void
  isEditing?: boolean
}

const PANTRY_STAPLES = new Set([
  'salt','pepper','oil','butter','garlic','onion','water',
  'sugar','flour','eggs','egg','milk','cream','stock','broth',
  'tomato paste','soy sauce','vinegar','lemon juice','olive oil',
  'vegetable oil','baking powder','baking soda','cornstarch',
  'honey','mustard','black pepper','white pepper',
])

function isStaple(name: string): boolean {
  return PANTRY_STAPLES.has(name.toLowerCase().trim())
}

function computeShared(recipes: Recipe[]): Set<string> {
  const counts = new Map<string, number>()
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const key = ing.name.toLowerCase()
      if (isStaple(key)) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const shared = new Set<string>()
  for (const [key, count] of counts) {
    if (count >= 2) shared.add(key)
  }
  return shared
}

function sharedWith(recipe: Recipe, others: Recipe[]): string[] {
  const pool = new Set(
    others.flatMap(r => r.ingredients.map(i => i.name.toLowerCase()))
      .filter(n => !isStaple(n))
  )
  return recipe.ingredients
    .filter(i => pool.has(i.name.toLowerCase()) && !isStaple(i.name))
    .map(i => i.name)
}

function getISOWeek(d: Date): number {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

const PROTEIN_LABEL: Record<ProteinType, string> = {
  kjott:   'Kjøtt',
  kylling: 'Kylling',
  fisk:    'Fisk',
  vegetar: 'Vegetar',
}

const PROTEIN_COLORS: Record<ProteinType, { color: string; bg: string }> = {
  kjott:   { color: '#c47a7a', bg: 'rgba(140,58,58,0.15)' },
  kylling: { color: '#c4a96a', bg: 'rgba(140,122,78,0.15)' },
  fisk:    { color: '#7aaac4', bg: 'rgba(90,122,140,0.15)' },
  vegetar: { color: '#7ab88a', bg: 'rgba(74,124,89,0.15)' },
}

export default function MenuBuilder({
  dinnerRecipes,
  initialRecipes,
  initialName,
  onSave,
  onCancel,
  isEditing = false,
}: Props) {
  const [step, setStep]             = useState<Step>(initialRecipes.length > 0 ? 'review' : 'anchor')
  const [menuRecipes, setMenuRecipes] = useState<Recipe[]>(initialRecipes)
  const [menuName, setMenuName]     = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [swapIndex, setSwapIndex]   = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialName) {
      const now = new Date()
      const week = getISOWeek(now)
      setMenuName(`Week ${week} ${now.getFullYear()}`)
    }
  }, [])

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  const runSuggest = useCallback(async (anchor: Recipe) => {
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/menus/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anchor_recipe_id: anchor.id }),
      })
      if (!res.ok) throw new Error('Suggestion failed')
      const { recipe_ids } = await res.json() as { recipe_ids: string[] }
      const suggested = recipe_ids
        .map(id => dinnerRecipes.find(r => r.id === id))
        .filter((r): r is Recipe => r !== undefined)
        .slice(0, 3)
      setMenuRecipes([anchor, ...suggested])
      setStep('review')
    } catch {
      setError('Could not get suggestions. Please try again.')
      setStep('anchor')
    }
  }, [dinnerRecipes])

  function handleSwapPick(recipe: Recipe) {
    if (swapIndex === null) return
    const next = [...menuRecipes]
    next[swapIndex] = recipe
    setMenuRecipes(next)
    setSwapIndex(null)
    setStep('review')
  }

  function getDominantProtein(recipes: Recipe[]): ProteinType | undefined {
    const counts: Record<string, number> = {}
    for (const r of recipes) {
      if (r.protein_type) counts[r.protein_type] = (counts[r.protein_type] ?? 0) + 1
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] as ProteinType | undefined
  }

  function handleSave() {
    onSave({ name: menuName.trim(), recipes: menuRecipes, dominant_protein: getDominantProtein(menuRecipes) })
  }

  const shared      = step === 'review' ? computeShared(menuRecipes) : new Set<string>()
  const sharedCount = shared.size

  // ── Anchor Picker ──────────────────────────────────────────────────────
  if (step === 'anchor') {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', paddingBottom: 80 }}>
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onCancel} style={styles.backBtn}>←</button>
          <div>
            <h1 style={styles.heading}>Pick your anchor</h1>
            <p style={styles.subheading}>AI will suggest 3 recipes that share ingredients</p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {dinnerRecipes.map(recipe => (
            <AnchorCard key={recipe.id} recipe={recipe} onPick={r => runSuggest(r)} />
          ))}
          {dinnerRecipes.length === 0 && (
            <p style={{ gridColumn: 'span 2', color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-geist-sans)', fontSize: 14 }}>
              No dinner recipes yet — import some first
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Generating ─────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={styles.spinner} />
        <p style={{ color: 'var(--color-text-dim)', fontSize: 14, fontFamily: 'var(--font-geist-sans)', margin: 0 }}>
          Finding recipes that work together…
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // ── Swap Picker ────────────────────────────────────────────────────────
  if (step === 'swap') {
    const currentIds = new Set(menuRecipes.map(r => r.id))
    const others     = menuRecipes.filter((_, i) => i !== swapIndex)
    const candidates = dinnerRecipes.filter(r => !currentIds.has(r.id))

    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', paddingBottom: 80 }}>
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { setSwapIndex(null); setStep('review') }} style={styles.backBtn}>←</button>
          <h1 style={styles.heading}>Swap recipe</h1>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {candidates.map(recipe => {
            const overlap = sharedWith(recipe, others)
            return (
              <button key={recipe.id} onClick={() => handleSwapPick(recipe)} style={styles.swapRow}>
                <Thumb recipe={recipe} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowTitle}>{recipe.title}</div>
                  {overlap.length > 0 ? (
                    <div style={{ color: '#52b788', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>
                      {overlap.length} shared: {overlap.slice(0, 2).join(', ')}{overlap.length > 2 ? ` +${overlap.length - 2}` : ''}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-dim)', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>
                      No shared ingredients
                    </div>
                  )}
                </div>
              </button>
            )
          })}
          {candidates.length === 0 && (
            <p style={{ color: 'var(--color-text-dim)', textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-geist-sans)', fontSize: 14 }}>
              No other dinner recipes available
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Review ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onCancel} style={styles.backBtn}>←</button>
        <h1 style={styles.heading}>{isEditing ? 'Edit menu' : 'Your week menu'}</h1>
      </div>

      {/* Menu name — click to edit */}
      <div style={{ padding: '16px 16px 0' }}>
        {editingName ? (
          <input
            ref={nameInputRef}
            value={menuName}
            onChange={e => setMenuName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
            placeholder="Menu name"
            style={styles.nameInput}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            style={{
              width:         '100%',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'space-between',
              padding:       '12px 14px',
              background:    'var(--color-surface)',
              border:        '1px solid var(--color-border)',
              borderRadius:  12,
              cursor:        'pointer',
              textAlign:     'left' as const,
            }}
          >
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize:   16,
              color:      menuName.trim() ? 'var(--color-text)' : 'var(--color-text-dim)',
              flex:       1,
              overflow:   'hidden',
              whiteSpace: 'nowrap',
              textOverflow:'ellipsis',
            }}>
              {menuName.trim() || 'Menu name'}
            </span>
            <span style={{
              fontFamily:    'var(--font-geist-mono)',
              fontSize:      9,
              color:         'var(--color-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              flexShrink:    0,
              marginLeft:    8,
            }}>
              EDIT
            </span>
          </button>
        )}
      </div>

      {/* Shared ingredient count */}
      {menuRecipes.length > 0 && (
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          {sharedCount >= 3 ? (
            <span style={styles.sharedPill}>{sharedCount} shared ingredients</span>
          ) : (
            <button
              onClick={() => runSuggest(menuRecipes[0])}
              style={styles.amberBtn}
            >
              Only {sharedCount} shared — regenerate?
            </button>
          )}
        </div>
      )}

      {/* Recipe cards */}
      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {menuRecipes.map((recipe, i) => {
          const recipeShared = recipe.ingredients
            .filter(ing => shared.has(ing.name.toLowerCase()))
            .map(ing => ing.name)
          const isAnchor = i === 0
          const pt = recipe.protein_type as ProteinType | undefined

          return (
            <div key={recipe.id} style={styles.recipeCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <Thumb recipe={recipe} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                    {isAnchor && <Badge text="Anchor" bg="var(--color-accent)" color="#fff" />}
                    {pt && (
                      <Badge
                        text={PROTEIN_LABEL[pt]}
                        bg={PROTEIN_COLORS[pt].bg}
                        color={PROTEIN_COLORS[pt].color}
                      />
                    )}
                  </div>
                  <div style={styles.rowTitle}>{recipe.title}</div>
                </div>
                {isAnchor ? (
                  <button onClick={() => setStep('anchor')} style={styles.changeBtn}>Change</button>
                ) : (
                  <button onClick={() => { setSwapIndex(i); setStep('swap') }} style={styles.swapBtn}>Swap</button>
                )}
              </div>

              {recipeShared.length > 0 && (
                <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {recipeShared.slice(0, 5).map(name => (
                    <span key={name} style={styles.ingPill}>{name}</span>
                  ))}
                  {recipeShared.length > 5 && (
                    <span style={{ color: 'var(--color-text-dim)', fontSize: 11, fontFamily: 'var(--font-geist-mono)', padding: '3px 0' }}>
                      +{recipeShared.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Regenerate */}
      {!isEditing && menuRecipes.length > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={() => runSuggest(menuRecipes[0])}
            style={styles.regenBtn}
          >
            ↺  Regenerate suggestions
          </button>
        </div>
      )}

      {/* Sticky save bar */}
      <div style={styles.saveBar}>
        <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!menuName.trim() || menuRecipes.length === 0}
          style={{
            ...styles.saveBtn,
            background: menuName.trim() && menuRecipes.length > 0 ? 'var(--color-accent)' : 'rgba(90,107,66,0.3)',
            cursor: menuName.trim() && menuRecipes.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {isEditing ? 'Save changes' : 'Save menu'}
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Thumb({ recipe, size }: { recipe: Recipe; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--color-subtle)' }}>
      {recipe.image_url
        ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.4) }}>🍽️</div>
      }
    </div>
  )
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
      {text}
    </span>
  )
}

function AnchorCard({ recipe, onPick }: { recipe: Recipe; onPick: (r: Recipe) => void }) {
  const pt = recipe.protein_type as ProteinType | undefined
  const pColor = pt ? PROTEIN_COLORS[pt] : null
  return (
    <button onClick={() => onPick(recipe)} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
      <div style={{ height: 110, background: 'var(--color-subtle)', position: 'relative' }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍽️</div>
        }
        {pt && pColor && (
          <div style={{
            position:       'absolute',
            top:            6,
            right:          6,
            background:     pColor.bg,
            border:         `1px solid ${pColor.color}`,
            backdropFilter: 'blur(4px)',
            borderRadius:   5,
            padding:        '2px 7px',
            fontSize:       9,
            color:          pColor.color,
            fontFamily:     'var(--font-geist-mono)',
            textTransform:  'uppercase',
          }}>
            {PROTEIN_LABEL[pt]}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-geist-sans)', lineHeight: 1.3 }}>
        {recipe.title}
      </div>
    </button>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

const styles = {
  heading:    { color: 'var(--color-text)', fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  subheading: { color: 'var(--color-text-dim)', fontSize: 13, margin: '2px 0 0', fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  backBtn:    { color: 'var(--color-text-dim)', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px 4px 0', flexShrink: 0 } as React.CSSProperties,
  errorBanner: { margin: '12px 16px 0', padding: '10px 14px', background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 10, color: '#e94560', fontSize: 13, fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  spinner:    { width: 40, height: 40, border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } as React.CSSProperties,
  swapRow:    { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' } as React.CSSProperties,
  rowTitle:   { color: 'var(--color-text)', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-geist-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
  nameInput:  { width: '100%', background: 'var(--color-surface)', border: '1px solid rgba(90,107,66,0.5)', borderRadius: 12, padding: '12px 14px', color: 'var(--color-text)', fontSize: 16, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  sharedPill: { background: 'rgba(90,107,66,0.15)', border: '1px solid rgba(90,107,66,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--color-accent)', fontFamily: 'var(--font-geist-mono)' } as React.CSSProperties,
  amberBtn:   { background: 'rgba(244,162,97,0.1)', border: '1px solid rgba(244,162,97,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#f4a261', fontFamily: 'var(--font-geist-mono)', cursor: 'pointer' } as React.CSSProperties,
  recipeCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties,
  ingPill:    { background: 'rgba(82,183,136,0.1)', border: '1px solid rgba(82,183,136,0.2)', borderRadius: 20, padding: '3px 9px', fontSize: 11, color: '#52b788', fontFamily: 'var(--font-geist-mono)' } as React.CSSProperties,
  changeBtn:  { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', color: 'var(--color-text-dim)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)', flexShrink: 0 } as React.CSSProperties,
  swapBtn:    { background: 'var(--color-accent-light)', border: '1px solid rgba(90,107,66,0.3)', borderRadius: 8, padding: '6px 10px', color: 'var(--color-accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)', flexShrink: 0 } as React.CSSProperties,
  regenBtn:   { width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, color: 'var(--color-text-dim)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  saveBar:    { position: 'fixed', bottom: 64, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)', display: 'flex', gap: 10 } as React.CSSProperties,
  cancelBtn:  { padding: '14px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, color: 'var(--color-text-dim)', fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)', flexShrink: 0 } as React.CSSProperties,
  saveBtn:    { flex: 1, padding: 14, border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
}
