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
          <div className="flex items-start justify-between mb-4">
            <div>
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
            <button
              onClick={() => setImportDrawerOpen(true)}
              className="rounded-lg px-4 py-2 text-[11px] font-medium tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-80"
              style={{ background: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
            >
              + Add
            </button>
          </div>

          {/* Search + filter icon */}
          <div className="relative mb-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-4 py-2.5 pr-11 text-[13px] text-[#f0ede8] placeholder:text-white/20 focus:outline-none focus:border-white/20"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            />
            <button
              onClick={() => setDrawerOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{
                background: filterPills.length > 0 ? 'rgba(244,162,97,0.15)' : 'transparent',
                color: filterPills.length > 0 ? '#f4a261' : 'rgba(255,255,255,0.3)',
              }}
              aria-label="Open filters"
            >
              <FilterIcon active={filterPills.length > 0} />
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
          <div className="flex flex-col items-center pt-20 gap-3">
            <span className="text-4xl">🍳</span>
            <p
              className="text-[12px] text-white/20"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              No recipes found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 4h11M4 7.5h7M6 11h3"
        stroke={active ? '#f4a261' : 'rgba(255,255,255,0.3)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
