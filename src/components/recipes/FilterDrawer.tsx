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

const CUISINES: string[] = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Japanese',
  'Thai', 'Mediterranean', 'American', 'French', 'Greek',
  'Middle Eastern', 'Chinese', 'Korean', 'Spanish',
]

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

  function setCuisine(value: string) {
    onChange({
      ...filters,
      cuisine: filters.cuisine === value ? undefined : value,
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

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(247,244,239,0.7)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {/* Handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
            >
              Filters
            </h2>
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

          {/* Cuisine */}
          <Section label="Cuisine">
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(value => (
                <Chip
                  key={value}
                  label={value}
                  active={filters.cuisine === value}
                  onClick={() => setCuisine(value)}
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
                    borderColor: filters.min_rating === r ? '#f4a261' : 'var(--color-border)',
                    color: filters.min_rating === r ? 'var(--color-bg)' : 'var(--color-text-dim)',
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

        {/* Sticky footer */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            flexShrink: 0,
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: '12px 20px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={clearAll}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 13,
              color: 'var(--color-text-dim)',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 2,
              padding: '13px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--color-accent)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Show results
          </button>
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
        className="text-[10px] uppercase tracking-[0.1em] mb-3"
        style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--color-text-dim)' }}
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
        borderColor: active ? '#f4a261' : 'var(--color-border)',
        color: active ? '#f4a261' : 'var(--color-text-dim)',
      }}
    >
      {label}
    </button>
  )
}
