'use client'

import { useState } from 'react'
import type { MenuWithRecipes, Recipe } from '../../../types/recipe'

type ProteinType = 'kjott' | 'kylling' | 'fisk' | 'vegetar'

interface Props {
  menu: MenuWithRecipes
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onSetActive: (addToShoppingList: boolean) => void
}

const PROTEIN_LABEL: Record<ProteinType, string> = {
  kjott:   'Kjøtt',
  kylling: 'Kylling',
  fisk:    'Fisk',
  vegetar: 'Vegetar',
}

export default function MenuDetail({ menu, onBack, onEdit, onDelete, onSetActive }: Props) {
  const [showActiveSheet, setShowActiveSheet] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)

  function handleSetActive(addToShoppingList: boolean) {
    setShowActiveSheet(false)
    onSetActive(addToShoppingList)
  }

  function handleDelete() {
    setShowDeleteSheet(false)
    onDelete()
  }

  const pt = menu.dominant_protein as ProteinType | undefined

  return (
    <>
      <div style={{ background: '#0a0a0a', minHeight: '100dvh', paddingBottom: 120 }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <button onClick={onBack} style={styles.backBtn}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {menu.is_active && (
                  <span style={styles.activeBadge}>● Active</span>
                )}
                {pt && (
                  <span style={styles.proteinBadge}>{PROTEIN_LABEL[pt]}</span>
                )}
                {menu.week_number != null && (
                  <span style={styles.weekBadge}>Week {menu.week_number}{menu.year ? ` · ${menu.year}` : ''}</span>
                )}
              </div>
              <h1 style={styles.heading}>{menu.name}</h1>
            </div>
          </div>
          <button onClick={onEdit} style={styles.editBtn}>Edit</button>
        </div>

        {/* Recipe list */}
        <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {menu.recipes.map((recipe: Recipe) => (
            <RecipeRow key={recipe.id} recipe={recipe} />
          ))}
          {menu.recipes.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-geist-sans)', fontSize: 14 }}>
              No recipes in this menu
            </p>
          )}
        </div>

        {/* Delete button */}
        <div style={{ padding: '24px 16px 0' }}>
          <button onClick={() => setShowDeleteSheet(true)} style={styles.deleteBtn}>
            Delete menu
          </button>
        </div>
      </div>

      {/* Sticky bottom action */}
      <div style={styles.stickyBar}>
        {menu.is_active ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <div style={styles.activeLabel}>This is your current week&apos;s menu</div>
            <button
              onClick={() => onSetActive(true)}
              style={{ ...styles.primaryBtn, background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)', color: '#52b788' }}
            >
              Add to shopping list
            </button>
          </div>
        ) : (
          <button onClick={() => setShowActiveSheet(true)} style={styles.primaryBtn}>
            Set as this week&apos;s menu
          </button>
        )}
      </div>

      {/* Active bottom sheet */}
      {showActiveSheet && (
        <BottomSheet onDismiss={() => setShowActiveSheet(false)}>
          <p style={styles.sheetTitle}>Add to shopping list?</p>
          <p style={styles.sheetBody}>
            Do you want to add the ingredients for this menu to your shopping list?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button onClick={() => handleSetActive(true)} style={styles.primaryBtn}>
              Yes, add to list
            </button>
            <button onClick={() => handleSetActive(false)} style={styles.ghostBtn}>
              No, just set as active
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Delete confirm sheet */}
      {showDeleteSheet && (
        <BottomSheet onDismiss={() => setShowDeleteSheet(false)}>
          <p style={styles.sheetTitle}>Delete &ldquo;{menu.name}&rdquo;?</p>
          <p style={styles.sheetBody}>This cannot be undone.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button
              onClick={handleDelete}
              style={{ ...styles.primaryBtn, background: '#e94560' }}
            >
              Delete
            </button>
            <button onClick={() => setShowDeleteSheet(false)} style={styles.ghostBtn}>
              Cancel
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RecipeRow({ recipe }: { recipe: Recipe }) {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
  return (
    <div style={styles.recipeRow}>
      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#1a0508' }}>
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-geist-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {recipe.title}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
          {totalTime > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>⏱ {totalTime}m</span>
          )}
          {recipe.cuisine && (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>{recipe.cuisine}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function BottomSheet({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
      />
      {/* Sheet */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#141414', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        {children}
      </div>
    </>
  )
}

// ── Style constants ────────────────────────────────────────────────────────

const styles = {
  heading:      { color: '#fff', fontSize: 22, fontWeight: 700, margin: 0, fontFamily: 'var(--font-geist-sans)', lineHeight: 1.2 } as React.CSSProperties,
  backBtn:      { color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px 4px 0', flexShrink: 0 } as React.CSSProperties,
  editBtn:      { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)', flexShrink: 0, marginTop: 4 } as React.CSSProperties,
  activeBadge:  { background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#52b788', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em' } as React.CSSProperties,
  proteinBadge: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' } as React.CSSProperties,
  weekBadge:    { background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-geist-mono)' } as React.CSSProperties,
  recipeRow:    { display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' } as React.CSSProperties,
  deleteBtn:    { width: '100%', background: 'transparent', border: '1px solid rgba(233,69,96,0.2)', borderRadius: 12, padding: 14, color: 'rgba(233,69,96,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  stickyBar:    { position: 'fixed', bottom: 64, left: 0, right: 0, padding: '12px 16px 28px', background: 'linear-gradient(to top, #0a0a0a 80%, transparent)', display: 'flex', flexDirection: 'column' as const, gap: 8 } as React.CSSProperties,
  activeLabel:  { color: '#52b788', fontSize: 13, fontFamily: 'var(--font-geist-sans)', textAlign: 'center' as const, margin: 0 } as React.CSSProperties,
  primaryBtn:   { width: '100%', padding: 14, background: '#e94560', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  ghostBtn:     { width: '100%', padding: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' } as React.CSSProperties,
  sheetTitle:   { color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-geist-sans)', margin: 0 } as React.CSSProperties,
  sheetBody:    { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'var(--font-geist-sans)', margin: '8px 0 0' } as React.CSSProperties,
}
