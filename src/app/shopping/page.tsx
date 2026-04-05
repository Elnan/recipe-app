'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getRecipes } from '../../../lib/recipes'
import { getMenus } from '../../../lib/menus'
import {
  STORE_SECTION_ORDER,
  STORE_SECTION_META,
  SHOPPING_UNITS,
  getIngredientPreset,
  getIngredientPresetWithDB,
  INGREDIENT_SECTION_MAP,
} from '../../../lib/store-sections'
import type { ShoppingListItem } from '../../../lib/shopping'
import type { StoreSection } from '../../../lib/store-sections'
import type { Recipe, MenuWithRecipes } from '../../../types/recipe'

const SECTION_COLORS: Record<StoreSection, string> = {
  produce:    '#4a7c59',
  meat:       '#8c3a3a',
  pålegg:     '#8c7a4e',
  bread:      '#8c6a3a',
  frozen:     '#4e6a8c',
  pantry:     '#8c7a4e',
  condiments: '#8c6a3a',
  dairy:      '#5a7a8c',
  drinks:     '#4e8c7a',
  snacks:     '#8c6a3a',
  other:      '#6a6a6a',
}

type RemovedItem = Pick<ShoppingListItem, 'name' | 'amount' | 'unit' | 'store_section'>

export default function ShoppingPage() {
  const [items, setItems]                     = useState<ShoppingListItem[]>([])
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState('')
  const [recipes, setRecipes]                 = useState<Recipe[]>([])
  const [menus, setMenus]                     = useState<MenuWithRecipes[]>([])
  const [recentlyRemoved, setRecentlyRemoved] = useState<RemovedItem[]>([])

  const [checking, setChecking]               = useState<Set<string>>(new Set())
  const checkingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [showSources, setShowSources]         = useState(false)
  const [sourceFilter, setSourceFilter]       = useState<{ type: 'recipe' | 'menu'; id: string } | null>(null)

  const [editingItem, setEditingItem]         = useState<ShoppingListItem | null>(null)

  const [mergeSourceId, setMergeSourceId]     = useState<string | null>(null)
  const [mergeTargetId, setMergeTargetId]     = useState<string | null>(null)

  const [searchFocused, setSearchFocused]     = useState(false)
  const [panelHeight, setPanelHeight]         = useState(0)
  const panelRef    = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/shopping').then(r => r.json()).then((d: { items: ShoppingListItem[] }) => d.items),
      getRecipes(),
      getMenus(),
    ]).then(([shoppingItems, recipeList, menuList]) => {
      const seen = new Map<string, ShoppingListItem>()
      const dupeIds: string[] = []
      for (const item of shoppingItems) {
        const key = item.name.toLowerCase()
        const existing = seen.get(key)
        if (existing) {
          existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1)
          dupeIds.push(item.id)
        } else {
          seen.set(key, { ...item })
        }
      }
      const deduped = [...seen.values()]
      setItems(deduped)
      for (const id of dupeIds) {
        fetch(`/api/shopping/${id}`, { method: 'DELETE' })
      }
      for (const item of deduped) {
        const original = shoppingItems.find(i => i.id === item.id)
        if (original && original.quantity !== item.quantity) {
          fetch(`/api/shopping/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: item.quantity }),
          })
        }
      }
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

  const mergeSource = items.find(i => i.id === mergeSourceId) ?? null
  const mergeTarget = items.find(i => i.id === mergeTargetId) ?? null

  // ── Check off ─────────────────────────────────────────────────────────────
  function handleCheckOff(item: ShoppingListItem) {
    if (checking.has(item.id)) {
      const timer = checkingTimers.current.get(item.id)
      if (timer) clearTimeout(timer)
      checkingTimers.current.delete(item.id)
      setChecking(prev => { const next = new Set(prev); next.delete(item.id); return next })
      return
    }

    setChecking(prev => new Set(prev).add(item.id))
    const timer = setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id))
      setRecentlyRemoved(prev =>
        [{ name: item.name, amount: item.amount, unit: item.unit, store_section: item.store_section },
          ...prev].slice(0, 9),
      )
      checkingTimers.current.delete(item.id)
      setChecking(prev => { const next = new Set(prev); next.delete(item.id); return next })
      fetch(`/api/shopping/${item.id}`, { method: 'DELETE' })
    }, 2000)
    checkingTimers.current.set(item.id, timer)
  }

  // ── Item tap ──────────────────────────────────────────────────────────────
  function handleItemTap(item: ShoppingListItem) {
    if (mergeSourceId) {
      if (item.id !== mergeSourceId) setMergeTargetId(item.id)
      return
    }
    handleCheckOff(item)
  }

  // ── Add from search ───────────────────────────────────────────────────────
  async function handleAddByName(name: string) {
    if (editingItem && editingItem.name.toLowerCase() === name.toLowerCase()) {
      const newQty = (editingItem.quantity ?? 1) + 1
      handlePatch(editingItem.id, { quantity: newQty })
      setSearchQuery('')
      focusInput()
      return
    }

    const existingItem = items.find(i => i.name.toLowerCase() === name.toLowerCase())
    if (existingItem) {
      const newQty = (existingItem.quantity ?? 1) + 1
      handlePatch(existingItem.id, { quantity: newQty })
      setEditingItem({ ...existingItem, quantity: newQty })
      setSearchQuery('')
      focusInput()
      return
    }

    const syncPreset = getIngredientPreset(name)
    const tempId     = `temp-${Date.now()}`
    const tempItem: ShoppingListItem = {
      id: tempId, created_at: new Date().toISOString(),
      notes: null, source_recipe_id: null, source_menu_id: null,
      quantity: 1, name,
      amount: syncPreset.amount, unit: syncPreset.unit,
      store_section: syncPreset.section, is_manual: true,
    }
    setItems(prev => [...prev, tempItem])
    setEditingItem(tempItem)
    setSearchQuery('')
    focusInput()

    const dbPreset = await getIngredientPresetWithDB(name)
    if (dbPreset.section !== syncPreset.section || dbPreset.amount !== syncPreset.amount || dbPreset.unit !== syncPreset.unit) {
      const refinement = { amount: dbPreset.amount, unit: dbPreset.unit, store_section: dbPreset.section }
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, ...refinement } : i))
      setEditingItem(prev => prev?.id === tempId ? { ...prev, ...refinement } : prev)
    }

    const payload = { name, amount: dbPreset.amount, unit: dbPreset.unit, store_section: dbPreset.section, is_manual: true }
    const res = await fetch('/api/shopping', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (res.ok) {
      const { item: created } = await res.json() as { item: ShoppingListItem }
      setItems(prev => prev.map(i => i.id === tempId ? created : i))
      setEditingItem(prev => prev?.id === tempId ? created : prev)
    } else {
      setItems(prev => prev.filter(i => i.id !== tempId))
      setEditingItem(null)
    }
  }

  function focusInput() {
    if (blurTimerRef.current) { clearTimeout(blurTimerRef.current); blurTimerRef.current = null }
    setSearchFocused(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Patch ─────────────────────────────────────────────────────────────────
  function handlePatch(
    id: string,
    patch: Partial<Pick<ShoppingListItem, 'amount' | 'unit' | 'store_section' | 'quantity'>>,
  ) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    setEditingItem(prev => prev?.id === id ? { ...prev, ...patch } : prev)
    if (id.startsWith('temp-')) return
    fetch(`/api/shopping/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (patch.store_section) {
      const item = items.find(i => i.id === id)
      if (item) {
        fetch('/api/ingredients/section', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name: item.name, section: patch.store_section }),
        })
      }
    }
  }

  // ── Remove source ─────────────────────────────────────────────────────────
  function handleRemoveSource(field: 'recipe_id' | 'menu_id', id: string) {
    if (!confirm('Remove all items from this source?')) return
    if (field === 'recipe_id') setItems(prev => prev.filter(i => i.source_recipe_id !== id))
    else                       setItems(prev => prev.filter(i => i.source_menu_id   !== id))
    fetch(`/api/shopping/source?${field}=${id}`, { method: 'DELETE' })
    if (sourceFilter?.id === id) setSourceFilter(null)
  }

  // ── Merge ─────────────────────────────────────────────────────────────────
  function handleLongPress(item: ShoppingListItem) {
    setMergeSourceId(item.id)
    setMergeTargetId(null)
  }

  function handleMergeConfirm() {
    if (!mergeSource || !mergeTarget) return
    const combined = (mergeSource.amount ?? 0) + (mergeTarget.amount ?? 0)
    handlePatch(mergeSource.id, { amount: combined })
    setItems(prev => prev.filter(i => i.id !== mergeTarget.id))
    fetch(`/api/shopping/${mergeTarget.id}`, { method: 'DELETE' })
    setMergeSourceId(null)
    setMergeTargetId(null)
  }

  function handleMergeCancel() {
    setMergeSourceId(null)
    setMergeTargetId(null)
  }

  // ── Source data ───────────────────────────────────────────────────────────
  const recipeSourceIds = [...new Set(items.flatMap(i => i.source_recipe_id ? [i.source_recipe_id] : []))]
  const menuSourceIds   = [...new Set(items.flatMap(i => i.source_menu_id   ? [i.source_menu_id]   : []))]
  const hasSources      = recipeSourceIds.length > 0 || menuSourceIds.length > 0

  // ── Filtered items ────────────────────────────────────────────────────────
  const visibleItems = sourceFilter
    ? items.filter(i =>
        sourceFilter.type === 'recipe'
          ? i.source_recipe_id === sourceFilter.id
          : i.source_menu_id === sourceFilter.id
      )
    : items

  // ── Suggestions ───────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase()
  const suggestions: RemovedItem[] = q
    ? (() => {
        const fromRecent = recentlyRemoved.filter(r => r.name.toLowerCase().includes(q))
        const fromMap = Object.keys(INGREDIENT_SECTION_MAP)
          .filter(k => k.includes(q) && !fromRecent.some(r => r.name.toLowerCase() === k))
          .slice(0, 9 - fromRecent.length)
          .map(k => ({
            name: k,
            amount: 1 as number | null,
            unit: 'stk' as string | null,
            store_section: (INGREDIENT_SECTION_MAP[k] ?? 'other') as StoreSection,
          }))
        return [...fromRecent, ...fromMap].slice(0, 9)
      })()
    : recentlyRemoved

  // ── Grouped ───────────────────────────────────────────────────────────────
  const grouped = STORE_SECTION_ORDER.reduce<Record<StoreSection, ShoppingListItem[]>>(
    (acc, section) => { acc[section] = visibleItems.filter(i => i.store_section === section); return acc },
    {} as Record<StoreSection, ShoppingListItem[]>,
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', paddingBottom: panelHeight + 64 }}>

      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-4"
        style={{
          background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-[28px] font-bold leading-none tracking-tight"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
            >
              Shopping
            </h1>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}>
              {loading ? '…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {hasSources && (
            <button
              onClick={() => setShowSources(s => !s)}
              className="rounded-lg px-3 py-1.5 text-[11px] tracking-[0.04em] border"
              style={{
                fontFamily:  'var(--font-geist-mono)',
                color:       'var(--color-text-dim)',
                borderColor: 'var(--color-border)',
                background:  showSources ? 'var(--color-surface)' : 'transparent',
              }}
            >
              Sources
            </button>
          )}
        </div>

        {/* Source pills — toggled */}
        {showSources && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {sourceFilter && (
              <button
                onClick={() => setSourceFilter(null)}
                className="shrink-0 rounded-full px-3 py-1 text-[10px] border"
                style={{ fontFamily: 'var(--font-geist-mono)', background: 'var(--color-surface)', color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}
              >
                Show all
              </button>
            )}
            {recipeSourceIds.map(id => {
              const recipe     = recipes.find(r => r.id === id)
              const isFiltered = sourceFilter?.type === 'recipe' && sourceFilter.id === id
              return (
                <div
                  key={id}
                  className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1 border"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => setSourceFilter(isFiltered ? null : { type: 'recipe', id })}
                    className="text-[10px]"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    🍽️ {recipe?.title ?? 'Recipe'}
                  </button>
                  <button
                    onClick={() => handleRemoveSource('recipe_id', id)}
                    className="text-[9px] ml-0.5"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
            {menuSourceIds.map(id => {
              const menu       = menus.find(m => m.id === id)
              const isFiltered = sourceFilter?.type === 'menu' && sourceFilter.id === id
              return (
                <div
                  key={id}
                  className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1 border"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => setSourceFilter(isFiltered ? null : { type: 'menu', id })}
                    className="text-[10px]"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    📅 {menu?.name ?? 'Menu'}
                  </button>
                  <button
                    onClick={() => handleRemoveSource('menu_id', id)}
                    className="text-[9px] ml-0.5"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="px-5 pt-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <span className="text-[11px]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}>
              Loading…
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-2">
            <span className="text-3xl" style={{ color: 'var(--color-text-dim)' }}>✓</span>
            <p
              className="text-[18px] font-semibold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
            >
              All done!
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
            >
              Your list is empty
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {STORE_SECTION_ORDER.map(section => {
              const sectionItems = grouped[section]
              if (sectionItems.length === 0) return null
              const color = SECTION_COLORS[section]
              const meta  = STORE_SECTION_META[section]
              return (
                <div key={section}>
                  <div className="flex items-center gap-2.5 mb-1 pl-1">
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: color }} />
                    <span
                      className="text-[10px] uppercase tracking-[0.08em]"
                      style={{ fontFamily: 'var(--font-geist-mono)', color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {sectionItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        isChecking={checking.has(item.id)}
                        isMergeSource={item.id === mergeSourceId}
                        isMergeMode={mergeSourceId !== null}
                        onTap={() => handleItemTap(item)}
                        onLongPress={() => handleLongPress(item)}
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
        style={{ bottom: 64, background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
      >
        {/* Merge mode banner */}
        {mergeSourceId && !mergeTargetId && (
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
          >
            <span className="text-[11px] text-amber-400" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              Tap another item to merge into {mergeSource?.name}
            </span>
            <button
              onClick={handleMergeCancel}
              className="text-[11px] text-amber-400/60 border border-amber-400/20 rounded-lg px-2.5 py-1"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Edit sheet */}
        {editingItem && !mergeSourceId && (
          <EditSheet
            item={editingItem}
            onPatch={patch => handlePatch(editingItem.id, patch)}
            onClose={() => setEditingItem(null)}
          />
        )}

        {/* Suggestions */}
        {(() => {
          const hasQuery       = searchQuery.trim().length > 0
          const showRecent     = !hasQuery && recentlyRemoved.length > 0 && searchFocused
          const showSearch     = hasQuery && suggestions.length > 0 && searchFocused
          if ((!showRecent && !showSearch) || mergeSourceId) return null
          const displayItems   = showRecent
            ? recentlyRemoved.slice(0, 2)
            : suggestions.slice(0, 5)
          return (
            <div
              className="flex w-full flex-col overflow-hidden"
              style={{
                background:    'var(--color-surface)',
                borderBottom:  '1px solid var(--color-border)',
              }}
            >
              {showRecent && (
                <span
                  className="text-[9px] uppercase tracking-[0.08em] px-5 pt-2 pb-1"
                  style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                >
                  Recent
                </span>
              )}
              {displayItems.map((s, i) => {
                const catColor = SECTION_COLORS[s.store_section]
                return (
                <button
                  type="button"
                  key={`${s.name}-${i}`}
                  onClick={() => handleAddByName(s.name)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left border-b last:border-b-0"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      aria-hidden
                      className="shrink-0 rounded-full"
                      style={{ width: 6, height: 6, background: catColor }}
                    />
                    <span
                      className="truncate text-[15px]"
                      style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {s.name}
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ fontFamily: 'var(--font-geist-mono)', color: catColor }}
                  >
                    {STORE_SECTION_META[s.store_section].label}
                  </span>
                </button>
                )
              })}
            </div>
          )
        })()}

        {/* Search bar */}
        {!mergeSourceId && (
          <div className="px-4 py-3" style={{ background: 'var(--color-bg)' }}>
            <form
              onSubmit={e => {
                e.preventDefault()
                if (searchQuery.trim()) handleAddByName(searchQuery.trim())
              }}
            >
              <div
                className="flex items-center rounded-xl px-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <span className="text-[16px] mr-2 leading-none" style={{ color: 'var(--color-text-dim)' }}>+</span>
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (blurTimerRef.current) { clearTimeout(blurTimerRef.current); blurTimerRef.current = null }
                    setSearchFocused(true)
                  }}
                  onBlur={() => {
                    blurTimerRef.current = setTimeout(() => { setSearchFocused(false); blurTimerRef.current = null }, 150)
                  }}
                  placeholder="Add an ingredient…"
                  className="flex-1 py-3 text-[14px] outline-none bg-transparent placeholder:text-[color:var(--color-text-dim)]"
                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Merge confirm sheet */}
      {mergeSource && mergeTarget && (
        <MergeConfirmSheet
          source={mergeSource}
          target={mergeTarget}
          onConfirm={handleMergeConfirm}
          onCancel={handleMergeCancel}
        />
      )}
    </div>
  )
}

// ── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  isChecking,
  isMergeSource,
  isMergeMode,
  onTap,
  onLongPress,
}: {
  item:          ShoppingListItem
  isChecking:    boolean
  isMergeSource: boolean
  isMergeMode:   boolean
  onTap:         () => void
  onLongPress:   () => void
}) {
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  function startLongPress() {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress()
    }, 500)
  }

  function cancelLongPress() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  function handleClick() {
    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }
    onTap()
  }

  const amountStr = item.amount != null
    ? `${item.quantity > 1 ? `${item.quantity} × ` : ''}${item.amount} ${item.unit ?? ''}`.trim()
    : item.unit ?? ''

  return (
    <div
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      className={`flex items-center gap-3 cursor-pointer${isMergeSource ? ' animate-pulse' : ''}`}
      style={{
        opacity:       isChecking ? 0.5 : 1,
        background:    isMergeSource
          ? 'rgba(245,158,11,0.14)'
          : isMergeMode
            ? 'rgba(245,158,11,0.07)'
            : 'var(--color-surface)',
        border:        '1px solid var(--color-border)',
        borderRadius:  10,
        marginBottom:  4,
        padding:       '11px 12px',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: SECTION_COLORS[item.store_section],
        opacity: 0.6, flexShrink: 0,
      }} />

      <span
        className="flex-1 text-[14px]"
        style={{
          color:          'var(--color-text)',
          fontFamily:     'var(--font-geist-sans)',
          textDecoration: isChecking ? 'line-through' : 'none',
        }}
      >
        {item.name}
      </span>

      {amountStr && (
        <span
          className="shrink-0 text-[11px]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          {amountStr}
        </span>
      )}
    </div>
  )
}

// ── EditSheet ────────────────────────────────────────────────────────────────

function EditSheet({
  item,
  onPatch,
  onClose,
}: {
  item:    ShoppingListItem
  onPatch: (patch: Partial<Pick<ShoppingListItem, 'amount' | 'unit' | 'store_section' | 'quantity'>>) => void
  onClose: () => void
}) {
  const qty    = item.quantity ?? 1
  const amount = item.amount ?? 1
  const unit   = item.unit ?? 'stk'
  const label  = qty > 1 ? `${qty} × ${amount} ${unit}` : `${amount} ${unit}`

  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Name + close */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[15px] font-medium"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
        >
          {item.name}
        </span>
        <button
          onClick={onClose}
          className="text-[12px] p-1"
          style={{ color: 'var(--color-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Quantity row */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => onPatch({ quantity: Math.max(1, qty - 1) })}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 22, height: 22, background: 'var(--color-border)', color: 'var(--color-text-dim)' }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>−</span>
        </button>
        <span
          className="text-[22px]"
          style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif', minWidth: 24, textAlign: 'center' as const }}
        >
          {qty}
        </span>
        <button
          onClick={() => onPatch({ quantity: qty + 1 })}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 22, height: 22, background: 'var(--color-border)', color: 'var(--color-text-dim)' }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
        </button>
        <span
          className="text-[12px]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          {label}
        </span>
      </div>

      {/* Aisle row */}
      <div className="flex flex-wrap gap-1.5">
        {STORE_SECTION_ORDER.map(section => {
          const active = item.store_section === section
          const color  = SECTION_COLORS[section]
          return (
            <button
              key={section}
              onClick={() => onPatch({ store_section: section })}
              className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.06em]"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                background: active ? color : 'transparent',
                color:      active ? '#fff' : 'var(--color-text-dim)',
                border:     `1px solid ${active ? color : 'var(--color-border)'}`,
              }}
            >
              {STORE_SECTION_META[section].label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── MergeConfirmSheet ────────────────────────────────────────────────────────

function MergeConfirmSheet({
  source,
  target,
  onConfirm,
  onCancel,
}: {
  source:    ShoppingListItem
  target:    ShoppingListItem
  onConfirm: () => void
  onCancel:  () => void
}) {
  const combined = (source.amount ?? 0) + (target.amount ?? 0)
  const unit     = source.unit ?? target.unit ?? ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <div
        className="w-full rounded-t-2xl px-6 pt-6 pb-10 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <p
          className="text-[11px] uppercase tracking-[0.08em] mb-4"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          Merge items
        </p>
        <p
          className="text-[17px] font-semibold mb-1"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
        >
          Merge {target.name} into {source.name}?
        </p>
        <p
          className="text-[13px] mb-6"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          Combined: {combined} {unit} · keeps name &ldquo;{source.name}&rdquo;
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-3 text-[13px] font-medium border"
            style={{ fontFamily: 'var(--font-geist-sans)', color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl py-3 text-[13px] font-semibold text-white"
            style={{ background: 'rgba(245,158,11,0.8)', fontFamily: 'var(--font-geist-sans)' }}
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  )
}
