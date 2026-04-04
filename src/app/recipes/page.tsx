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
  all:       '#f0ede8',
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

const CATEGORY_EMOJI: Record<string, string> = {
  dinner: '🍽️', breakfast: '☀️', baking: '🍞', dessert: '🍮', other: '🥄',
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
  const [searchOpen,        setSearchOpen]        = useState(false)
  const [contentVisible,    setContentVisible]    = useState(false)
  const inputRef      = useRef<HTMLInputElement>(null)
  const openTimerRef  = useRef<ReturnType<typeof setTimeout>>(undefined)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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
    clearTimeout(closeTimerRef.current)
    setSearchOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
    openTimerRef.current = setTimeout(() => setContentVisible(true), 220)
  }

  function closeSearch() {
    clearTimeout(openTimerRef.current)
    setContentVisible(false)
    closeTimerRef.current = setTimeout(() => {
      setSearchOpen(false)
      setSearch('')
    }, 60)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 border-b border-white/[0.05] px-5 pt-5 pb-3"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <div className="mx-auto max-w-6xl">

          {/* Title row */}
          <div className="mb-4">
            <h1
              className="text-[28px] font-bold leading-none text-[#f0ede8] tracking-tight"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
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
              gap: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10, padding: '8px 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes…"
                style={{ flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', fontSize: 13,
                  color: '#f0ede8',
                  fontFamily: 'var(--font-geist-sans)' }}
              />
            </div>
            <button onClick={() => setDrawerOpen(true)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
                color: 'rgba(255,255,255,0.5)', display: 'flex',
                alignItems: 'center', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 4h11M4 7.5h7M6 11h3"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat
              const accent = CATEGORY_ACCENT[cat]
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); if (cat !== 'dinner') setActiveProtein('all') }}
                  className="shrink-0 rounded-md px-3 py-1 text-[10px] uppercase tracking-[0.08em] border transition-all"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: active ? accent : 'transparent',
                    borderColor: active ? accent : 'rgba(255,255,255,0.08)',
                    color: active ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {cat === 'all' ? 'All' : `${CATEGORY_EMOJI[cat]} ${cat}`}
                </button>
              )
            })}
          </div>

          {/* Protein type tabs */}
          {activeCategory === 'dinner' && <div className="flex gap-1.5 overflow-x-auto pb-0.5 mt-1.5 scrollbar-none">
            {PROTEIN_TYPES.map(pt => {
              const active = activeProtein === pt.value
              return (
                <button
                  key={pt.value}
                  onClick={() => setActiveProtein(pt.value)}
                  className="shrink-0 rounded-md px-3 py-1 text-[10px] uppercase tracking-[0.08em] border transition-all"
                  style={{
                    fontFamily:  'var(--font-geist-mono)',
                    background:  active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    borderColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color:       active ? 'rgba(255,255,255,0.8)'  : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {pt.label}
                </button>
              )
            })}
          </div>}

          {/* Active filter pills */}
          {filterPills.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {filterPills.map(pill => (
                <span
                  key={pill.label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] border border-[#f4a261]/40 text-[#f4a261] bg-[#f4a261]/10"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {pill.label}
                  <button
                    onClick={pill.onRemove}
                    className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                    aria-label={`Remove ${pill.label} filter`}
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
      <div className="mx-auto max-w-6xl px-5 pt-5 pb-16">
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
                className="text-[32px] font-bold text-[#f0ede8] tracking-tight"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
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
                      background:  'rgba(255,255,255,0.04)',
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
            <div className="flex flex-col items-center pt-20 gap-4">
              <p
                className="text-[12px] text-white/30"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                No recipes match your filters
              </p>
              <button
                onClick={() => { setFilters({}); setActiveCategory('all'); setActiveProtein('all') }}
                className="rounded-xl px-4 py-2 text-[11px] border transition-colors hover:border-white/20"
                style={{
                  fontFamily:  'var(--font-geist-mono)',
                  background:  'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color:       'rgba(255,255,255,0.4)',
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

      {/* Fixed search FAB — mobile only */}
      <div className="block sm:hidden">
      <div
        style={{
          position:    'fixed',
          bottom:      80,
          right:       14,
          zIndex:      20,
          display:     'flex',
          alignItems:  'center',
          filter:      'drop-shadow(0 2px 8px rgba(0,0,0,0.18))',
        }}
      >
        {/* Input area — expands leftward */}
        <div
          style={{
            width:        searchOpen ? 240 : 0,
            height:       48,
            overflow:     'hidden',
            borderRadius: '24px 0 0 24px',
            borderTop:    searchOpen ? '1.5px solid #5a6b42' : 'none',
            borderBottom: searchOpen ? '1.5px solid #5a6b42' : 'none',
            borderLeft:   searchOpen ? '1.5px solid #5a6b42' : 'none',
            borderRight:  'none',
            background:   '#fff',
            display:      'flex',
            alignItems:   'center',
            transition:   searchOpen
              ? 'width 0.30s cubic-bezier(0.4,0,0.2,1), border-color 0.20s ease, background 0.20s ease'
              : 'width 0.18s cubic-bezier(0.4,0,1,1), border-color 0.14s ease, background 0.14s ease',
          }}
        >
          <div
            style={{
              display:       'flex',
              alignItems:    'center',
              width:         '100%',
              paddingLeft:   14,
              paddingRight:  8,
              gap:           8,
              opacity:       contentVisible ? 1 : 0,
              transition:    contentVisible ? 'opacity 0.12s ease' : 'opacity 0.10s ease',
              pointerEvents: contentVisible ? 'auto' : 'none',
              whiteSpace:    'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a6b42" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') closeSearch() }}
              placeholder="Search recipes…"
              className="placeholder:text-[rgba(26,26,22,0.35)]"
              style={{
                flex:       1,
                minWidth:   0,
                background: 'transparent',
                border:     'none',
                outline:    'none',
                fontSize:   14,
                color:      '#1a1a16',
                fontFamily: 'var(--font-geist-sans)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  flexShrink: 0,
                  color:      'rgba(26,26,22,0.4)',
                  fontSize:   14,
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
                  stroke={filterPills.length > 0 ? '#5a6b42' : 'rgba(90,107,66,0.45)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Olive cap */}
        <button
          onClick={searchOpen ? closeSearch : openSearch}
          aria-label={searchOpen ? 'Close search' : 'Open search'}
          style={{
            width:          48,
            height:         48,
            flexShrink:     0,
            background:     '#5a6b42',
            borderRadius:   searchOpen ? '0 24px 24px 0' : 24,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'white',
            fontSize:       20,
            lineHeight:     1,
            border:         'none',
            cursor:         'pointer',
            transition:     searchOpen
              ? 'border-radius 0.30s cubic-bezier(0.4,0,0.2,1)'
              : 'border-radius 0.08s cubic-bezier(0.4,0,1,1) 0.12s',
          }}
        >
          {searchOpen ? '✕' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
        </button>
      </div>
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

