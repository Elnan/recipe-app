'use client'

import type { RecipeFilters } from '../../../lib/recipes'

// TODO: icon toggle — swap label for icon when icons are added and display preference is set
const METHOD_META: Record<string, { label: string; icon: null }> = {
  pan:       { label: 'Pan',      icon: null },
  oven:      { label: 'Oven',     icon: null },
  pot:       { label: 'Pot',      icon: null },
  'one-pan': { label: 'One pan',  icon: null },
  grill:     { label: 'Grill',    icon: null },
  wok:       { label: 'Wok',      icon: null },
  'no-cook': { label: 'No cook',  icon: null },
}

const DIETARY_META: Record<string, { label: string; icon: null }> = {
  vegetarian:    { label: 'Vegetarian',  icon: null },
  vegan:         { label: 'Vegan',       icon: null },
  'gluten-free': { label: 'Gluten free', icon: null },
  'dairy-free':  { label: 'Dairy free',  icon: null },
  'nut-free':    { label: 'Nut free',    icon: null },
}

const MAX_TIME_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 20, label: 'Under 20m' },
  { value: 30, label: 'Under 30m' },
  { value: 45, label: 'Under 45m' },
  { value: 60, label: 'Under 1hr' },
]

interface FilterDrawerProps {
  open: boolean
  filters: RecipeFilters
  onChange: (filters: RecipeFilters) => void
  onClose: () => void
}

export default function FilterDrawer({ open, filters, onChange, onClose }: FilterDrawerProps) {
  function toggleDietary(value: string) {
    const current = filters.dietary ?? []
    const next = current.includes(value)
      ? current.filter(d => d !== value)
      : [...current, value]
    onChange({ ...filters, dietary: next.length > 0 ? next : undefined })
  }

  function setCookingMethod(value: string) {
    onChange({
      ...filters,
      cooking_method: filters.cooking_method === value ? undefined : value,
    })
  }

  function setMaxTime(value: number) {
    onChange({
      ...filters,
      max_time_minutes: filters.max_time_minutes === value ? undefined : value,
    })
  }

  function setMinRating(value: number) {
    onChange({
      ...filters,
      min_rating: filters.min_rating === value ? undefined : value,
    })
  }

  function clearAll() {
    onChange({})
  }

  const hasFilters =
    filters.cooking_method != null ||
    filters.max_time_minutes != null ||
    filters.min_rating != null ||
    (filters.dietary && filters.dietary.length > 0)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#111] border-t border-white/[0.06] transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/10" />
        </div>

        <div className="px-5 pt-2 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[15px] font-semibold text-[#f0ede8]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Filters
            </h2>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cooking method */}
          <Section label="Cooking method">
            <div className="flex flex-wrap gap-2">
              {Object.entries(METHOD_META).map(([value, { label }]) => (
                <Chip
                  key={value}
                  label={label}
                  active={filters.cooking_method === value}
                  onClick={() => setCookingMethod(value)}
                />
              ))}
            </div>
          </Section>

          {/* Max time */}
          <Section label="Max time">
            <div className="flex flex-wrap gap-2">
              {MAX_TIME_OPTIONS.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  active={filters.max_time_minutes === value}
                  onClick={() => setMaxTime(value)}
                />
              ))}
            </div>
          </Section>

          {/* Min rating */}
          <Section label="Min rating">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] border transition-colors"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: filters.min_rating === r ? '#f4a261' : 'transparent',
                    borderColor: filters.min_rating === r ? '#f4a261' : 'rgba(255,255,255,0.08)',
                    color: filters.min_rating === r ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {'★'.repeat(r)}
                </button>
              ))}
            </div>
          </Section>

          {/* Dietary */}
          <Section label="Dietary" last>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DIETARY_META).map(([value, { label }]) => (
                <Chip
                  key={value}
                  label={label}
                  active={(filters.dietary ?? []).includes(value)}
                  onClick={() => toggleDietary(value)}
                />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}

function Section({
  label,
  children,
  last,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={last ? 'mb-0' : 'mb-6'}>
      <p
        className="text-[10px] uppercase tracking-[0.1em] text-white/25 mb-3"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.07em] border transition-colors"
      style={{
        fontFamily: 'var(--font-geist-mono)',
        background: active ? 'rgba(244,162,97,0.15)' : 'transparent',
        borderColor: active ? '#f4a261' : 'rgba(255,255,255,0.08)',
        color: active ? '#f4a261' : 'rgba(255,255,255,0.35)',
      }}
    >
      {label}
    </button>
  )
}
