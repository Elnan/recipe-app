'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import RecipeCard from '../../components/recipes/RecipeCard'
import FilterDrawer from '../../components/recipes/FilterDrawer'
import ImportDrawer from '../../components/recipes/ImportDrawer'
import BottomNav from '../../components/layout/BottomNav'
import { getRecipes, type RecipeFilters } from '../../../lib/recipes'
import type { Recipe, RecipeCategory, NewRecipe } from '../../../types/recipe'

const CATEGORIES: Array<'all' | RecipeCategory> = [
  'all', 'dinner', 'breakfast', 'baking', 'dessert', 'other',
]

const PROTEIN_TYPES: Array<{ value: string; label: string }> = [
  { value: 'all',     label: 'All'     },
  { value: 'kjott',   label: 'Kjøtt'   },
  { value: 'kylling', label: 'Kylling' },
  { value: 'fisk',    label: 'Fisk'    },
  { value: 'vegetar', label: 'Vegetar' },
]

const CATEGORY_ACCENT: Record<string, string> = {
  all:       'var(--color-text)',
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

export default function RecipesPage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | RecipeCategory>('all')
  const [activeProtein,  setActiveProtein]  = useState('all')
  const [filters, setFilters] = useState<RecipeFilters>({})
  const [drawerOpen,        setDrawerOpen]        = useState(false)
  const [importDrawerOpen,  setImportDrawerOpen]  = useState(false)
  const [importPrefillText, setImportPrefillText] = useState<string | undefined>()
  const [importDefaultTab,  setImportDefaultTab]  = useState<'url' | 'text' | 'photo' | undefined>()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false)
  const [vvKeyboardGap, setVvKeyboardGap] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getRecipes()
      .then(setAllRecipes)
      .catch(err => console.error('getRecipes error:', err))
      .finally(() => setLoading(false))

    // Web Share Target: open ImportDrawer pre-filled if share text is waiting
    const prefill = sessionStorage.getItem('import:prefill')
    if (prefill) {
      sessionStorage.removeItem('import:prefill')
      setImportPrefillText(prefill)
      setImportDrawerOpen(true)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('import') === 'true') {
      setImportDrawerOpen(true)
      window.history.replaceState({}, '', '/recipes')
    }
  }, [])

  // Client-side filtering
  const filtered = useMemo(() => {
    return allRecipes.filter(r => {
      if (activeCategory !== 'all' && r.category !== activeCategory) return false
      if (activeProtein  !== 'all' && r.protein_type !== activeProtein) return false

      if (search) {
        const q = search.toLowerCase()
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.description?.toLowerCase().includes(q)
        ) return false
      }

      if (filters.cooking_method && r.cooking_method !== filters.cooking_method) return false
      if (filters.cuisine && r.cuisine?.toLowerCase() !== filters.cuisine.toLowerCase()) return false
      if (filters.min_rating != null && (r.rating ?? 0) < filters.min_rating) return false
      if (filters.max_time_minutes != null) {
        const total = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0)
        if (total > filters.max_time_minutes) return false
      }
      if (filters.dietary && filters.dietary.length > 0) {
        if (!filters.dietary.every(d => r.dietary?.includes(d))) return false
      }

      return true
    })
  }, [allRecipes, activeCategory, activeProtein, search, filters])

  useEffect(() => {
    if (mobileSearchFocused && searchOpen) {
      document.body.setAttribute('data-recipes-mobile-search-focus', '')
    } else {
      document.body.removeAttribute('data-recipes-mobile-search-focus')
    }
    return () => document.body.removeAttribute('data-recipes-mobile-search-focus')
  }, [mobileSearchFocused, searchOpen])

  useEffect(() => {
    if (!searchOpen || !mobileSearchFocused) {
      setVvKeyboardGap(0)
      return
    }
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setVvKeyboardGap(gap)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [searchOpen, mobileSearchFocused])

  // Active filter pills
  const filterPills: Array<{ label: string; onRemove: () => void }> = []
  if (filters.cooking_method) {
    filterPills.push({
      label: filters.cooking_method,
      onRemove: () => setFilters(f => ({ ...f, cooking_method: undefined })),
    })
  }
  if (filters.cuisine) {
    filterPills.push({
      label: filters.cuisine,
      onRemove: () => setFilters(f => ({ ...f, cuisine: undefined })),
    })
  }
  if (filters.max_time_minutes != null) {
    filterPills.push({
      label: `≤ ${filters.max_time_minutes}m`,
      onRemove: () => setFilters(f => ({ ...f, max_time_minutes: undefined })),
    })
  }
  if (filters.min_rating != null) {
    filterPills.push({
      label: `${'★'.repeat(filters.min_rating)}+`,
      onRemove: () => setFilters(f => ({ ...f, min_rating: undefined })),
    })
  }
  filters.dietary?.forEach(d => {
    filterPills.push({
      label: d,
      onRemove: () =>
        setFilters(f => ({
          ...f,
          dietary: f.dietary?.filter(x => x !== d),
        })),
    })
  })

  function openSearch() {
    if (searchBlurTimerRef.current) {
      clearTimeout(searchBlurTimerRef.current)
      searchBlurTimerRef.current = null
    }
    setSearchOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function closeSearch() {
    if (searchBlurTimerRef.current) {
      clearTimeout(searchBlurTimerRef.current)
      searchBlurTimerRef.current = null
    }
    setMobileSearchFocused(false)
    setSearchOpen(false)
    setSearch('')
  }

  function handleMobileSearchFocus() {
    if (searchBlurTimerRef.current) {
      clearTimeout(searchBlurTimerRef.current)
      searchBlurTimerRef.current = null
    }
    setMobileSearchFocused(true)
  }

  function handleMobileSearchBlur() {
    searchBlurTimerRef.current = setTimeout(() => {
      setMobileSearchFocused(false)
      searchBlurTimerRef.current = null
    }, 200)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 border-b border-white/[0.05] px-5 pt-5 pb-3"
        style={{ background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)', backdropFilter: 'blur(16px)' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

          {/* Title row */}
          <div className="mb-4">
            <h1
              className="text-[28px] leading-none tracking-tight"
              style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif', fontWeight: 400 }}
            >
              Recipes
            </h1>
            <p
              className="mt-1 text-[10px] text-white/20"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {loading ? '…' : `${filtered.length} of ${allRecipes.length}`}
            </p>
          </div>

          {/* Desktop search bar */}
          <div className="hidden sm:flex items-center gap-2 mb-4">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center',
              gap: 8, background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '8px 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes…"
                style={{ flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', fontSize: 13,
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-geist-sans)' }}
              />
            </div>
            <button onClick={() => setDrawerOpen(true)}
              style={{ padding: '8px 12px', background: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: 12,
                color: 'var(--color-text-dim)', display: 'flex',
                alignItems: 'center', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 4h11M4 7.5h7M6 11h3"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Category tabs */}
          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              padding: '0 0 8px',
              scrollbarWidth: 'none',
            }}
          >
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); if (cat !== 'dinner') setActiveProtein('all') }}
                  className="rounded-full border transition-all cursor-pointer shrink-0 whitespace-nowrap px-3 py-1.5 text-[11px] min-h-[30px] md:px-4 md:py-[7px] md:text-[12px] md:min-h-[32px]"
                  style={{
                    fontFamily:    'var(--font-geist-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background:    active ? 'var(--color-accent)' : 'transparent',
                    borderColor:   active ? 'var(--color-accent)' : 'var(--color-border)',
                    color:         active ? 'var(--color-bg)' : 'var(--color-text-dim)',
                    fontWeight:    active ? 600 : 400,
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              )
            })}
          </div>

          {/* Protein type tabs */}
          {activeCategory === 'dinner' && (
            <div
              className="hide-scrollbar"
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                padding: '6px 0 8px',
                scrollbarWidth: 'none',
              }}
            >
              {PROTEIN_TYPES.map(pt => {
                const active = activeProtein === pt.value
                return (
                  <button
                    key={pt.value}
                    onClick={() => setActiveProtein(pt.value)}
                    className="rounded-full border transition-all cursor-pointer shrink-0 whitespace-nowrap px-3 py-1.5 text-[11px] min-h-[30px] md:px-4 md:py-[7px] md:text-[12px] md:min-h-[32px]"
                    style={{
                      fontFamily:    'var(--font-geist-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background:    active ? 'var(--color-accent)' : 'transparent',
                      borderColor:   active ? 'var(--color-accent)' : 'var(--color-border)',
                      color:         active ? 'var(--color-bg)' : 'var(--color-text-dim)',
                      fontWeight:    active ? 600 : 400,
                    }}
                  >
                    {pt.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active filter pills */}
          {filterPills.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {filterPills.map(pill => (
                <span
                  key={pill.label}
                  className="flex items-center gap-1.5 border border-[#f4a261]/40 text-[#f4a261] bg-[#f4a261]/10"
                  style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, padding: '5px 12px', borderRadius: 999, minHeight: 28 }}
                >
                  {pill.label}
                  <button
                    onClick={pill.onRemove}
                    className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                    aria-label={`Remove ${pill.label} filter`}
                    style={{ fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipe grid */}
      <div className="px-5 pt-5 pb-16" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div className="flex justify-center pt-20">
            <span
              className="text-[11px] text-white/20"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              Loading…
            </span>
          </div>
        ) : filtered.length === 0 ? (
          allRecipes.length === 0 ? (
            <div className="flex flex-col items-center pt-20 gap-6">
              <h2
                className="text-[32px] font-bold tracking-tight"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
              >
                Your cookbook is empty
              </h2>
              <p
                className="text-[12px] text-white/30"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Add your first recipe
              </p>
              <div className="flex gap-3">
                {([
                  { tab: 'url'   as const, label: '🔗 URL'   },
                  { tab: 'text'  as const, label: '📋 Paste'  },
                  { tab: 'photo' as const, label: '📷 Photo'  },
                ]).map(({ tab, label }) => (
                  <button
                    key={tab}
                    onClick={() => { setImportDefaultTab(tab); setImportDrawerOpen(true) }}
                    className="rounded-xl px-4 py-2.5 text-[12px] border transition-colors hover:border-white/20"
                    style={{
                      fontFamily:  'var(--font-geist-mono)',
                      background:  'var(--color-surface)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color:       'rgba(255,255,255,0.5)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '60px 20px', gap: 12, textAlign: 'center',
            }}>
              <span style={{ fontSize: 32 }}>🔍</span>
              <p style={{
                fontFamily: 'Georgia, serif', fontSize: 18,
                color: 'var(--color-text)', fontWeight: 400, margin: 0,
              }}>
                No recipes match
              </p>
              <p style={{
                fontFamily: 'var(--font-geist-mono)', fontSize: 11,
                color: 'var(--color-text-dim)',
                textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
              }}>
                Try adjusting your filters
              </p>
              <button
                onClick={() => { setFilters({}); setActiveCategory('all'); setActiveProtein('all'); setSearch('') }}
                style={{
                  marginTop: 8,
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: '1px solid var(--color-accent)',
                  background: 'transparent',
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile search — FAB when collapsed; full-width dock + visualViewport when open (nav hidden while focused) */}
      <div className="block sm:hidden">
        {!searchOpen ? (
          <button
            type="button"
            onClick={openSearch}
            aria-label="Open search"
            style={{
              position:       'fixed',
              bottom:         80,
              right:          14,
              zIndex:         20,
              width:          48,
              height:         48,
              borderRadius:   24,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     'var(--color-accent)',
              color:          'white',
              border:         'none',
              cursor:         'pointer',
              boxShadow:      '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
        ) : (
          <div
            style={{
              position:   'fixed',
              left:       0,
              right:      0,
              zIndex:     40,
              bottom:     mobileSearchFocused ? vvKeyboardGap + 8 : 80,
              padding:    '0 12px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            }}
          >
            <div
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           8,
                minHeight:     48,
                padding:       '10px 12px 10px 14px',
                borderRadius:  24,
                border:        '1.5px solid var(--color-accent)',
                background:    'var(--color-surface)',
                boxShadow:     '0 2px 12px rgba(0,0,0,0.12)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={handleMobileSearchFocus}
                onBlur={handleMobileSearchBlur}
                onKeyDown={e => { if (e.key === 'Escape') closeSearch() }}
                placeholder="Search recipes…"
                className="placeholder:text-[color:var(--color-text-dim)]"
                style={{
                  flex:         1,
                  minWidth:     0,
                  background:   'transparent',
                  border:       'none',
                  outline:      'none',
                  fontSize:     16,
                  color:        'var(--color-text)',
                  fontFamily:   'var(--font-geist-sans)',
                }}
              />
              {search && (
                <button
                  type="button"
                  onPointerDown={e => e.preventDefault()}
                  onClick={() => setSearch('')}
                  style={{
                    flexShrink: 0,
                    color:      'var(--color-text-dim)',
                    fontSize:   16,
                    lineHeight: 1,
                    padding:    4,
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                  }}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onPointerDown={e => e.preventDefault()}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open filters"
                style={{
                  flexShrink:     0,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          32,
                  height:         32,
                  padding:        0,
                  background:     'none',
                  border:         'none',
                  cursor:         'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 3h10M2.5 6h7M4 9h4"
                    stroke={filterPills.length > 0 ? 'var(--color-accent)' : 'var(--color-text-dim)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                style={{
                  flexShrink:     0,
                  width:          36,
                  height:         36,
                  borderRadius:   18,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  background:     'var(--color-accent)',
                  color:          'white',
                  fontSize:       18,
                  lineHeight:     1,
                  border:         'none',
                  cursor:         'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Page-level BottomNav (z-31) overrides the layout one so Import opens the drawer directly */}
      <BottomNav onImportClick={() => setImportDrawerOpen(true)} />

      {/* Import drawer */}
      <ImportDrawer
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        prefillText={importPrefillText}
        defaultTab={importDefaultTab}
        onSave={async (recipe: NewRecipe) => {
          const res  = await fetch('/api/recipes', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(recipe),
          })
          if (res.ok) {
            const { recipe: saved } = await res.json()
            setAllRecipes(prev => [saved, ...prev])
          }
        }}
        onUpdate={async (id, recipe) => {
          const res = await fetch(`/api/recipes/${id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(recipe),
          })
          if (res.ok) {
            const { recipe: updated } = await res.json()
            setAllRecipes(prev => prev.map(r => r.id === updated.id ? updated : r))
          }
        }}
      />
    </div>
  )
}

