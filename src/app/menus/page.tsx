'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getMenus, createMenu, updateMenu, deleteMenu, setMenuActive, setMenuRecipes } from '../../../lib/menus'
import { getRecipes } from '../../../lib/recipes'
import MenuBuilder from '../../components/menus/MenuBuilder'
import MenuDetail from '../../components/menus/MenuDetail'
import RecipeDetail from '../../components/recipes/RecipeDetail'
import type { MenuWithRecipes, Recipe } from '../../../types/recipe'

type View = 'list' | 'detail' | 'builder' | 'recipe'
type ProteinFilter = 'all' | 'kjott' | 'kylling' | 'fisk' | 'vegetar'
type ProteinType = 'kjott' | 'kylling' | 'fisk' | 'vegetar'

const PROTEIN_TABS: Array<{ value: ProteinFilter; label: string }> = [
  { value: 'all',     label: 'All' },
  { value: 'kjott',   label: 'Kjøtt' },
  { value: 'kylling', label: 'Kylling' },
  { value: 'fisk',    label: 'Fisk' },
  { value: 'vegetar', label: 'Vegetar' },
]

const PROTEIN_LABEL: Record<string, string> = {
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

const PAGE_SIZE = 10

export default function MenusPage() {
  const [allMenus, setAllMenus]           = useState<MenuWithRecipes[]>([])
  const [dinnerRecipes, setDinnerRecipes] = useState<Recipe[]>([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState<View>('list')
  const [selectedMenu, setSelectedMenu]   = useState<MenuWithRecipes | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isEditing, setIsEditing]         = useState(false)
  const [proteinFilter, setProteinFilter] = useState<ProteinFilter>('all')
  const [scrollY, setScrollY]             = useState(0)
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const sentinelRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      getMenus(),
      getRecipes({ category: 'dinner' }),
    ])
      .then(([menus, recipes]) => {
        setAllMenus(menus)
        setDinnerRecipes(recipes)
      })
      .catch(err => console.error('MenusPage load error:', err))
      .finally(() => setLoading(false))
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE)
    }, { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  useEffect(() => {
    if (view !== 'recipe' || !selectedRecipeId || !selectedMenu) return
    const found =
      selectedMenu.recipes.find(r => r.id === selectedRecipeId)
      ?? dinnerRecipes.find(r => r.id === selectedRecipeId)
    if (!found) {
      setView('detail')
      setSelectedRecipeId(null)
    }
  }, [view, selectedRecipeId, selectedMenu, dinnerRecipes])

  async function refreshMenus() {
    const menus = await getMenus()
    setAllMenus(menus)
  }

  async function handleSave(data: { name: string; recipes: Recipe[]; dominant_protein?: string }) {
    const recipeIds = data.recipes.map(r => r.id)

    if (isEditing && selectedMenu) {
      await updateMenu(selectedMenu.id, {
        name: data.name,
        dominant_protein: data.dominant_protein as MenuWithRecipes['dominant_protein'],
      })
      await setMenuRecipes(selectedMenu.id, recipeIds)
    } else {
      const menu = await createMenu({
        name:             data.name,
        is_active:        false,
        dominant_protein: data.dominant_protein as MenuWithRecipes['dominant_protein'],
      })
      await setMenuRecipes(menu.id, recipeIds)
    }

    await refreshMenus()
    if (isEditing && selectedMenu) {
      const updated = await getMenus()
      setAllMenus(updated)
      const refreshed = updated.find(m => m.id === selectedMenu.id)
      if (refreshed) setSelectedMenu(refreshed)
      setView('detail')
    } else {
      const updated = await getMenus()
      setAllMenus(updated)
      const created = updated.find(m => m.name === data.name)
      if (created) { setSelectedMenu(created); setView('detail') }
      else setView('list')
    }
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!selectedMenu) return
    await deleteMenu(selectedMenu.id)
    await refreshMenus()
    setView('list')
    setSelectedMenu(null)
  }

  async function handleSetActive(_addToShoppingList: boolean) {
    if (!selectedMenu) return
    await setMenuActive(selectedMenu.id)
    const updated = await getMenus()
    setAllMenus(updated)
    const refreshed = updated.find(m => m.id === selectedMenu.id)
    if (refreshed) setSelectedMenu(refreshed)
  }

  const filtered = proteinFilter === 'all'
    ? allMenus
    : allMenus.filter(m => m.dominant_protein === proteinFilter)

  const activeMenu   = filtered.find(m => m.is_active) ?? null
  const otherMenus   = filtered.filter(m => !m.is_active)
  const pagedMenus   = otherMenus.slice(0, visibleCount)
  const hasMore       = visibleCount < otherMenus.length

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY((e.target as HTMLDivElement).scrollTop)
  }, [])

  const progress = Math.min(1, scrollY / 100)

  // ── Views ────────────────────────────────────────────────────────────────

  if (view === 'recipe' && selectedMenu && selectedRecipeId) {
    const recipeForView =
      selectedMenu.recipes.find(r => r.id === selectedRecipeId)
      ?? dinnerRecipes.find(r => r.id === selectedRecipeId)
    if (recipeForView) {
      return (
        <RecipeDetail
          key={selectedRecipeId}
          recipe={recipeForView}
          onBack={() => { setView('detail'); setSelectedRecipeId(null) }}
          onRecipeUpdate={updated => {
            setAllMenus(menus =>
              menus.map(m => {
                if (m.id !== selectedMenu.id) return m
                return {
                  ...m,
                  recipes: m.recipes.map(r => (r.id === updated.id ? updated : r)),
                }
              }),
            )
            setSelectedMenu(prev => {
              if (!prev || prev.id !== selectedMenu.id) return prev
              return {
                ...prev,
                recipes: prev.recipes.map(r => (r.id === updated.id ? updated : r)),
              }
            })
          }}
        />
      )
    }
  }

  if (view === 'builder') {
    return (
      <MenuBuilder
        dinnerRecipes={dinnerRecipes}
        initialRecipes={isEditing && selectedMenu ? selectedMenu.recipes : []}
        initialName={isEditing && selectedMenu ? selectedMenu.name : ''}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={() => {
          setView(selectedMenu && isEditing ? 'detail' : 'list')
          setIsEditing(false)
          setSelectedRecipeId(null)
        }}
      />
    )
  }

  if (view === 'detail' && selectedMenu) {
    return (
      <MenuDetail
        menu={selectedMenu}
        onBack={() => { setSelectedMenu(null); setView('list'); setSelectedRecipeId(null) }}
        onEdit={() => { setSelectedRecipeId(null); setIsEditing(true); setView('builder') }}
        onDelete={handleDelete}
        onSetActive={handleSetActive}
        onRecipeClick={id => { setSelectedRecipeId(id); setView('recipe') }}
      />
    )
  }

  // ── List view ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', height: '100dvh' }}>

      {/* Fixed zone — does not scroll */}
      <div
        style={{ flexShrink: 0 }}
        onWheel={e => {
          const el = scrollRef.current
          if (!el) return
          e.preventDefault()
          el.scrollTop += e.deltaY
        }}
      >
        {/* Title + New menu */}
        <div
          className="px-5 pt-5 pb-3 border-b"
          style={{
            background:   'color-mix(in srgb, var(--color-bg) 92%, transparent)',
            backdropFilter: 'blur(16px)',
            borderColor:    'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className="text-[28px] font-bold leading-none tracking-tight"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
              >
                Menus
              </h1>
              <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}>
                {loading ? '…' : `${filtered.length} menu${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => { setSelectedMenu(null); setIsEditing(false); setSelectedRecipeId(null); setView('builder') }}
              className="rounded-lg font-semibold tracking-wide px-3 py-2 text-[12px] min-h-[36px] md:px-5 md:py-2.5 md:text-[13px] md:min-h-[40px]"
              style={{ background: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-geist-mono)' }}
            >
              + New menu
            </button>
          </div>

          {/* Protein filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {PROTEIN_TABS.map(tab => {
              const active = proteinFilter === tab.value
              const pColor = tab.value !== 'all' ? PROTEIN_COLORS[tab.value as ProteinType] : null
              return (
                <button
                  key={tab.value}
                  onClick={() => setProteinFilter(tab.value)}
                  className="rounded-full border transition-colors px-3 py-1.5 text-[11px] min-h-[30px] md:px-4 md:py-[7px] md:text-[12px] md:min-h-[32px] shrink-0 whitespace-nowrap"
                  style={{
                    fontFamily:      'var(--font-geist-mono)',
                    letterSpacing:   '0.07em',
                    textTransform:   'uppercase',
                    background:      active
                      ? (pColor ? pColor.bg : 'rgba(90,107,66,0.2)')
                      : 'transparent',
                    borderColor:     active
                      ? (pColor ? pColor.color : 'var(--color-accent)')
                      : 'var(--color-border)',
                    color:           active
                      ? (pColor ? pColor.color : 'var(--color-accent)')
                      : 'var(--color-text-dim)',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active menu collapsing card */}
        {activeMenu && (
          <div className="px-4 pt-3 pb-0">
            {/* "This week" label — fades out */}
            <p
              className="text-[9px] uppercase tracking-[0.1em] mb-1.5 pl-1"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                color:      'var(--color-text-dim)',
                opacity:    1 - progress,
                transition: 'opacity 0.15s ease',
              }}
            >
              This week
            </p>

            <button
              onClick={() => { setSelectedMenu(activeMenu); setSelectedRecipeId(null); setView('detail') }}
              style={{
                width:        '100%',
                textAlign:    'left' as const,
                cursor:       'pointer',
                padding:      0,
                background:   'var(--color-surface)',
                border:       '1.5px solid rgba(90,107,66,0.5)',
                borderRadius: 16,
                overflow:     'hidden',
                transition:   'border-radius 0.2s ease',
              }}
            >
              {/* Image grid — collapses */}
              <div
                style={{
                  display:              'grid',
                  gridTemplateColumns:  '1fr 1fr',
                  gridTemplateRows:     '1fr 1fr',
                  gap:                  2,
                  height:               Math.round(160 * (1 - progress)),
                  overflow:             'hidden',
                  transition:           'height 0.1s ease',
                  opacity:              1 - progress,
                }}
              >
                {Array.from({ length: 4 }, (_, i) => activeMenu.recipes[i] ?? null).map((recipe, i) => (
                  <div key={i} style={{ background: 'var(--color-subtle)', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
                    {recipe?.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.3 }}>
                        🍽️
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Card body — always visible */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      color:        'var(--color-text)',
                      fontSize:     15,
                      fontWeight:   600,
                      fontFamily:   'Georgia, serif',
                      flex:         1,
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activeMenu.name}
                  </span>
                  {activeMenu.dominant_protein && (
                    <ProteinBadge protein={activeMenu.dominant_protein as ProteinType} />
                  )}
                </div>

                {/* Recipe list — fades out */}
                <div
                  style={{
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           2,
                    marginTop:     progress < 1 ? 6 : 0,
                    maxHeight:     Math.round(80 * (1 - progress)),
                    opacity:       1 - progress,
                    overflow:      'hidden',
                    transition:    'max-height 0.1s ease, opacity 0.15s ease',
                  }}
                >
                  {activeMenu.recipes.slice(0, 4).map(r => (
                    <span
                      key={r.id}
                      style={{ color: 'var(--color-text-dim)', fontSize: 12, fontFamily: 'var(--font-geist-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {r.title}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* "All menus" divider */}
        {otherMenus.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <span
              className="text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--color-text-dim)' }}
            >
              All menus
            </span>
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}
      >
        <div className="px-4">
          {loading ? (
            <div className="flex justify-center pt-20">
              <span className="text-[11px]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}>Loading…</span>
            </div>
          ) : otherMenus.length === 0 && !activeMenu ? (
            <div className="flex flex-col items-center pt-20 gap-3">
              <span className="text-4xl opacity-25">📅</span>
              <p className="text-[12px]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}>
                {proteinFilter === 'all' ? 'No menus yet' : 'No menus with this protein'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pagedMenus.map(menu => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onClick={() => { setSelectedMenu(menu); setSelectedRecipeId(null); setView('detail') }}
                />
              ))}
              {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ProteinBadge ──────────────────────────────────────────────────────────

function ProteinBadge({ protein }: { protein: ProteinType }) {
  const c = PROTEIN_COLORS[protein]
  return (
    <span
      style={{
        background:      c.bg,
        border:          `1px solid ${c.color}`,
        borderRadius:    6,
        padding:         '2px 7px',
        fontSize:        10,
        color:           c.color,
        fontFamily:      'var(--font-geist-mono)',
        textTransform:   'uppercase',
        letterSpacing:   '0.06em',
        flexShrink:      0,
      }}
    >
      {PROTEIN_LABEL[protein] ?? protein}
    </span>
  )
}

// ── MenuCard ──────────────────────────────────────────────────────────────

function MenuCard({ menu, onClick }: { menu: MenuWithRecipes; onClick: () => void }) {
  const slots = Array.from({ length: 4 }, (_, i) => menu.recipes[i] ?? null)

  return (
    <button
      onClick={onClick}
      style={{
        background:   'var(--color-surface)',
        border:       '1px solid var(--color-border)',
        borderRadius: 16,
        overflow:     'hidden',
        cursor:       'pointer',
        textAlign:    'left',
        width:        '100%',
        padding:      0,
      }}
    >
      {/* 2x2 image grid */}
      <div style={{
        display:              'grid',
        gridTemplateColumns:  '1fr 1fr',
        gridTemplateRows:     '1fr 1fr',
        height:               160,
        gap:                  2,
        overflow:             'hidden',
      }}
      >
        {slots.map((recipe, i) => (
          <div key={i} style={{ background: 'var(--color-subtle)', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            {recipe?.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.3 }}>
                🍽️
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              color:        'var(--color-text)',
              fontSize:     15,
              fontWeight:   600,
              fontFamily:   'Georgia, serif',
              flex:         1,
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {menu.name}
          </span>
          {menu.dominant_protein && (
            <ProteinBadge protein={menu.dominant_protein as ProteinType} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menu.recipes.slice(0, 4).map(r => (
            <span
              key={r.id}
              style={{ color: 'var(--color-text-dim)', fontSize: 12, fontFamily: 'var(--font-geist-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {r.title}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
