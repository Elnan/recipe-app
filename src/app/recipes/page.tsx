'use client'

import { useEffect, useState, useMemo } from 'react'
import RecipeCard from '../../components/recipes/RecipeCard'
import FilterDrawer from '../../components/recipes/FilterDrawer'
import ImportDrawer from '../../components/recipes/ImportDrawer'
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

  useEffect(() => {
    getRecipes()
      .then(setAllRecipes)
      .catch(err => console.error('getRecipes error:', err))
      .finally(() => setLoading(false))

    // Open import drawer if ?import=true is in the URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('import') === 'true') {
      setImportDrawerOpen(true)
      window.history.replaceState({}, '', '/recipes')
    }

    // Web Share Target: open ImportDrawer pre-filled if share text is waiting
    const prefill = sessionStorage.getItem('import:prefill')
    if (prefill) {
      sessionStorage.removeItem('import:prefill')
      setImportPrefillText(prefill)
      setImportDrawerOpen(true)
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

          {/* Search FAB */}
          <div className="relative mb-3" style={{ height: 40 }}>
            <div
              style={{
                position:     'absolute',
                left:         0,
                top:          0,
                height:       40,
                width:        searchOpen ? '100%' : 40,
                borderRadius: searchOpen ? 20 : '50%',
                background:   searchOpen ? 'rgba(255,255,255,0.95)' : '#5a6b42',
                border:       searchOpen ? '1.5px solid #5a6b42' : 'none',
                overflow:     'hidden',
                display:      'flex',
                alignItems:   'center',
                transition:   'width 250ms ease-out, border-radius 250ms ease-out, background 200ms ease-out',
              }}
            >
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <SearchIcon />
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingLeft: 12, paddingRight: 4, gap: 6 }}>
                  <SearchIcon dark />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); setSearchOpen(false) } }}
                    placeholder="Search recipes…"
                    style={{
                      flex:        1,
                      background:  'transparent',
                      border:      'none',
                      outline:     'none',
                      fontSize:    13,
                      color:       '#1a1a1a',
                      fontFamily:  'var(--font-geist-sans)',
                    }}
                  />
                  <button
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open filters"
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      padding:    '4px 8px',
                      borderRadius: 8,
                      background: filterPills.length > 0 ? 'rgba(90,107,66,0.12)' : 'transparent',
                    }}
                  >
                    <FilterIcon active={filterPills.length > 0} dark />
                  </button>
                </div>
              )}
            </div>
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
                Recipes
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
            <div className="flex flex-col items-center pt-20 gap-3">
              <span className="text-4xl">🍳</span>
              <p
                className="text-[12px] text-white/20"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                No recipes found
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
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

function SearchIcon({ dark = false }: { dark?: boolean }) {
  const c = dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.9)'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke={c} strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon({ active, dark = false }: { active: boolean; dark?: boolean }) {
  const c = dark
    ? (active ? '#5a6b42' : 'rgba(0,0,0,0.25)')
    : (active ? '#f4a261' : 'rgba(255,255,255,0.3)')
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4h11M4 7.5h7M6 11h3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
