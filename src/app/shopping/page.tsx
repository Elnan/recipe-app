'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getRecipes } from '../../../lib/recipes'
import { getMenus } from '../../../lib/menus'
import {
  STORE_SECTION_ORDER,
  STORE_SECTION_META,
  SHOPPING_UNITS,
  getIngredientPreset,
  INGREDIENT_SECTION_MAP,
} from '../../../lib/store-sections'
import type { ShoppingListItem } from '../../../lib/shopping'
import type { StoreSection } from '../../../lib/store-sections'
import type { Recipe, MenuWithRecipes } from '../../../types/recipe'

type RemovedItem = Pick<ShoppingListItem, 'name' | 'amount' | 'unit' | 'store_section'>

export default function ShoppingPage() {
  const [items, setItems]                     = useState<ShoppingListItem[]>([])
  const [loading, setLoading]                 = useState(true)
  const [selectedId, setSelectedId]           = useState<string | null>(null)
  const [recentlyRemoved, setRecentlyRemoved] = useState<RemovedItem[]>([])
  const [searchQuery, setSearchQuery]         = useState('')
  const [recipes, setRecipes]                 = useState<Recipe[]>([])
  const [menus, setMenus]                     = useState<MenuWithRecipes[]>([])
  const [panelHeight, setPanelHeight]         = useState(0)

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/shopping').then(r => r.json()).then((d: { items: ShoppingListItem[] }) => d.items),
      getRecipes(),
      getMenus(),
    ]).then(([shoppingItems, recipeList, menuList]) => {
      setItems(shoppingItems)
      setRecipes(recipeList)
      setMenus(menuList)
    }).finally(() => setLoading(false))
  }, [])

  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setPanelHeight(entries[0].contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const selectedItem = items.find(i => i.id === selectedId) ?? null

  // ── Remove ────────────────────────────────────────────────────────────────
  function handleRemove(item: ShoppingListItem) {
    setItems(prev => prev.filter(i => i.id !== item.id))
    if (selectedId === item.id) setSelectedId(null)
    setRecentlyRemoved(prev =>
      [{ name: item.name, amount: item.amount, unit: item.unit, store_section: item.store_section },
        ...prev].slice(0, 9),
    )
    fetch(`/api/shopping/${item.id}`, { method: 'DELETE' })
  }

  // ── Add from tile / search ────────────────────────────────────────────────
  async function handleAddByName(name: string) {
    const preset  = getIngredientPreset(name)
    const payload = {
      name,
      amount:        preset.amount,
      unit:          preset.unit,
      store_section: preset.section,
      is_manual:     true,
    }
    const tempId  = `temp-${Date.now()}`
    const tempItem: ShoppingListItem = {
      id: tempId, created_at: new Date().toISOString(),
      notes: null, source_recipe_id: null, source_menu_id: null,
      ...payload,
    }
    setItems(prev => [...prev, tempItem])
    setSelectedId(tempId)
    setSearchQuery('')

    const res = await fetch('/api/shopping', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (res.ok) {
      const { item: created } = await res.json() as { item: ShoppingListItem }
      setItems(prev => prev.map(i => i.id === tempId ? created : i))
      setSelectedId(created.id)
    } else {
      setItems(prev => prev.filter(i => i.id !== tempId))
      setSelectedId(null)
    }
  }

  // ── Patch ─────────────────────────────────────────────────────────────────
  function handlePatch(
    id: string,
    patch: Partial<Pick<ShoppingListItem, 'amount' | 'unit' | 'store_section'>>,
  ) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    if (id.startsWith('temp-')) return
    fetch(`/api/shopping/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
  }

  // ── Remove source ─────────────────────────────────────────────────────────
  function handleRemoveSource(field: 'recipe_id' | 'menu_id', id: string) {
    if (field === 'recipe_id') setItems(prev => prev.filter(i => i.source_recipe_id !== id))
    else                       setItems(prev => prev.filter(i => i.source_menu_id   !== id))
    fetch(`/api/shopping/source?${field}=${id}`, { method: 'DELETE' })
  }

  // ── Clear all ─────────────────────────────────────────────────────────────
  function handleClearAll() {
    if (!confirm('Clear the entire shopping list?')) return
    setItems([])
    setSelectedId(null)
    fetch('/api/shopping/clear', { method: 'POST' })
  }

  // ── Source pills ──────────────────────────────────────────────────────────
  const recipeSourceIds = [...new Set(items.flatMap(i => i.source_recipe_id ? [i.source_recipe_id] : []))]
  const menuSourceIds   = [...new Set(items.flatMap(i => i.source_menu_id   ? [i.source_menu_id]   : []))]

  // ── Suggestion tiles ──────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase()
  const suggestions: RemovedItem[] = q
    ? (() => {
        const fromRecent = recentlyRemoved.filter(r => r.name.toLowerCase().includes(q))
        const fromMap = Object.keys(INGREDIENT_SECTION_MAP)
          .filter(k => k.includes(q) && !fromRecent.some(r => r.name.toLowerCase() === k))
          .slice(0, 9 - fromRecent.length)
          .map(k => {
            const p = getIngredientPreset(k)
            return { name: k, amount: p.amount as number | null, unit: p.unit as string | null, store_section: p.section }
          })
        return [...fromRecent, ...fromMap].slice(0, 9)
      })()
    : recentlyRemoved

  // ── Grouped ───────────────────────────────────────────────────────────────
  const grouped = STORE_SECTION_ORDER.reduce<Record<StoreSection, ShoppingListItem[]>>(
    (acc, section) => { acc[section] = items.filter(i => i.store_section === section); return acc },
    {} as Record<StoreSection, ShoppingListItem[]>,
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ paddingBottom: panelHeight + 64 }}>

      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b border-white/5 px-5 pt-5 pb-4"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-[28px] font-bold leading-none text-[#f0ede8] tracking-tight"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Shopping
            </h1>
            <p className="mt-1 text-[10px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {loading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="rounded-lg px-4 py-2 text-[11px] font-medium tracking-[0.04em] border border-white/10 text-white/40"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Source pills */}
        {(recipeSourceIds.length > 0 || menuSourceIds.length > 0) && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
            {recipeSourceIds.map(id => {
              const recipe = recipes.find(r => r.id === id)
              return (
                <button
                  key={id}
                  onClick={() => handleRemoveSource('recipe_id', id)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] text-white/50 border border-white/10"
                  style={{ fontFamily: 'var(--font-geist-mono)', background: 'rgba(255,255,255,0.04)' }}
                >
                  🍽️ {recipe?.title ?? 'Recipe'}
                  <span className="text-white/25 ml-0.5">✕</span>
                </button>
              )
            })}
            {menuSourceIds.map(id => {
              const menu = menus.find(m => m.id === id)
              return (
                <button
                  key={id}
                  onClick={() => handleRemoveSource('menu_id', id)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] text-white/50 border border-white/10"
                  style={{ fontFamily: 'var(--font-geist-mono)', background: 'rgba(255,255,255,0.04)' }}
                >
                  📅 {menu?.name ?? 'Menu'}
                  <span className="text-white/25 ml-0.5">✕</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <span className="text-[11px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3">
            <span className="text-4xl">🛒</span>
            <p className="text-[12px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              Search below to add items
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {STORE_SECTION_ORDER.map(section => {
              const sectionItems = grouped[section]
              if (sectionItems.length === 0) return null
              const meta = STORE_SECTION_META[section]
              return (
                <div key={section}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{meta.emoji}</span>
                    <span
                      className="text-[11px] uppercase tracking-[0.08em] text-white/30"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {sectionItems.map(item => (
                      <ItemTile
                        key={item.id}
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={() => setSelectedId(item.id === selectedId ? null : item.id)}
                        onRemove={() => handleRemove(item)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom panel */}
      <div
        ref={panelRef}
        className="fixed left-0 right-0 z-30"
        style={{ bottom: 64, background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Zone 1: Edit zone */}
        {selectedItem && (
          <EditZone
            item={selectedItem}
            onPatch={patch => handlePatch(selectedItem.id, patch)}
            onRemove={() => handleRemove(selectedItem)}
          />
        )}

        {/* Zone 2: Suggestion tiles */}
        {suggestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
            {suggestions.map((s, i) => (
              <button
                key={`${s.name}-${i}`}
                onClick={() => handleAddByName(s.name)}
                className="shrink-0 rounded-xl px-3 py-2 text-left"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div
                  className="text-[13px] text-[#f0ede8] whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {s.name}
                </div>
                <div
                  className="text-[10px] text-white/30 whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {s.amount} {s.unit}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Zone 3: Search bar */}
        <div className="px-4 py-3">
          <form
            onSubmit={e => {
              e.preventDefault()
              if (searchQuery.trim()) handleAddByName(searchQuery.trim())
            }}
          >
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search or type an ingredient…"
              className="w-full rounded-xl px-4 py-3 text-[14px] text-[#f0ede8] outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border:     '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-geist-sans)',
              }}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

// ── ItemTile ──────────────────────────────────────────────────────────────────

function ItemTile({
  item,
  selected,
  onSelect,
  onRemove,
}: {
  item:     ShoppingListItem
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl px-3 pt-3 pb-3 cursor-pointer"
      style={{
        background: selected ? 'rgba(233,69,96,0.10)' : 'rgba(255,255,255,0.04)',
        border:     selected ? '1px solid rgba(233,69,96,0.35)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white/30"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        ✕
      </button>
      <div
        className="text-[14px] font-medium text-[#f0ede8] pr-5 leading-snug"
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        {item.name}
      </div>
      {(item.amount != null || item.unit) && (
        <div
          className="text-[11px] text-white/35 mt-0.5"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {item.amount != null ? `${item.amount} ${item.unit ?? ''}`.trim() : item.unit}
        </div>
      )}
    </div>
  )
}

// ── EditZone ──────────────────────────────────────────────────────────────────

function EditZone({
  item,
  onPatch,
  onRemove,
}: {
  item:     ShoppingListItem
  onPatch:  (patch: Partial<Pick<ShoppingListItem, 'amount' | 'unit' | 'store_section'>>) => void
  onRemove: () => void
}) {
  const [amountInput, setAmountInput] = useState(item.amount != null ? String(item.amount) : '')

  useEffect(() => {
    setAmountInput(item.amount != null ? String(item.amount) : '')
  }, [item.id])

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span
        className="flex-1 min-w-0 text-[13px] text-[#f0ede8] truncate"
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        {item.name}
      </span>
      <input
        type="number"
        value={amountInput}
        onChange={e => setAmountInput(e.target.value)}
        onBlur={() => {
          const val = parseFloat(amountInput)
          if (!isNaN(val)) onPatch({ amount: val })
        }}
        className="w-14 rounded-lg px-2 py-1.5 text-[12px] text-[#f0ede8] text-center outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--font-geist-mono)' }}
      />
      <select
        value={item.unit ?? 'stk'}
        onChange={e => onPatch({ unit: e.target.value })}
        className="rounded-lg px-2 py-1.5 text-[12px] text-[#f0ede8] outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--font-geist-mono)' }}
      >
        {SHOPPING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <select
        value={item.store_section}
        onChange={e => onPatch({ store_section: e.target.value as StoreSection })}
        className="rounded-lg px-2 py-1.5 text-[12px] text-[#f0ede8] outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--font-geist-sans)' }}
      >
        {STORE_SECTION_ORDER.map(s => (
          <option key={s} value={s}>{STORE_SECTION_META[s].emoji} {STORE_SECTION_META[s].label}</option>
        ))}
      </select>
      <button
        onClick={onRemove}
        className="rounded-lg px-2.5 py-1.5 text-[11px] text-white/40 border border-white/10 shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
