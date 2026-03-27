'use client'

import { useEffect, useState } from 'react'
import { getMenus, createMenu, updateMenu, deleteMenu, setMenuActive, setMenuRecipes } from '../../../lib/menus'
import { getRecipes } from '../../../lib/recipes'
import MenuBuilder from '../../components/menus/MenuBuilder'
import MenuDetail from '../../components/menus/MenuDetail'
import type { MenuWithRecipes, Recipe } from '../../../types/recipe'

type View = 'list' | 'detail' | 'builder'
type ProteinFilter = 'all' | 'kjott' | 'kylling' | 'fisk' | 'vegetar'

const PROTEIN_TABS: Array<{ value: ProteinFilter; label: string }> = [
  { value: 'all',     label: 'All' },
  { value: 'kjott',   label: 'Kjøtt' },
  { value: 'kylling', label: 'Kylling' },
  { value: 'fisk',    label: 'Fisk' },
  { value: 'vegetar', label: 'Vegetar' },
]

export default function MenusPage() {
  const [allMenus, setAllMenus]           = useState<MenuWithRecipes[]>([])
  const [dinnerRecipes, setDinnerRecipes] = useState<Recipe[]>([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState<View>('list')
  const [selectedMenu, setSelectedMenu]   = useState<MenuWithRecipes | null>(null)
  const [isEditing, setIsEditing]         = useState(false)
  const [proteinFilter, setProteinFilter] = useState<ProteinFilter>('all')

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

  async function refreshMenus() {
    const menus = await getMenus()
    setAllMenus(menus)
  }

  // ── Save handler (create or update) ─────────────────────────────────────
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
      // After edit — go back to detail with refreshed data
      const updated = await getMenus()
      setAllMenus(updated)
      const refreshed = updated.find(m => m.id === selectedMenu.id)
      if (refreshed) setSelectedMenu(refreshed)
      setView('detail')
    } else {
      // After create — find the newly created menu by name and go to detail
      const updated = await getMenus()
      setAllMenus(updated)
      const created = updated.find(m => m.name === data.name)
      if (created) { setSelectedMenu(created); setView('detail') }
      else setView('list')
    }
    setIsEditing(false)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedMenu) return
    await deleteMenu(selectedMenu.id)
    await refreshMenus()
    setView('list')
    setSelectedMenu(null)
  }

  // ── Set active ───────────────────────────────────────────────────────────
  async function handleSetActive(_addToShoppingList: boolean) {
    if (!selectedMenu) return
    await setMenuActive(selectedMenu.id)
    await refreshMenus()
    // Refresh selectedMenu with updated is_active state
    const updated = await getMenus()
    setAllMenus(updated)
    const refreshed = updated.find(m => m.id === selectedMenu.id)
    if (refreshed) setSelectedMenu(refreshed)
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = proteinFilter === 'all'
    ? allMenus
    : allMenus.filter(m => m.dominant_protein === proteinFilter)

  // ── Views ────────────────────────────────────────────────────────────────

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
        }}
      />
    )
  }

  if (view === 'detail' && selectedMenu) {
    return (
      <MenuDetail
        menu={selectedMenu}
        onBack={() => { setSelectedMenu(null); setView('list') }}
        onEdit={() => { setIsEditing(true); setView('builder') }}
        onDelete={handleDelete}
        onSetActive={handleSetActive}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b border-white/[0.05] px-5 pt-5 pb-3"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-[28px] font-bold leading-none text-[#f0ede8] tracking-tight"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Menus
            </h1>
            <p className="mt-1 text-[10px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {loading ? '…' : `${filtered.length} menu${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => { setSelectedMenu(null); setIsEditing(false); setView('builder') }}
            className="rounded-lg px-4 py-2 text-[11px] font-medium tracking-[0.04em] text-[#0a0a0a]"
            style={{ background: '#e94560', fontFamily: 'var(--font-geist-mono)' }}
          >
            + New menu
          </button>
        </div>

        {/* Protein filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {PROTEIN_TABS.map(tab => {
            const active = proteinFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setProteinFilter(tab.value)}
                className="shrink-0 rounded-md px-3 py-1 text-[10px] uppercase tracking-[0.08em] border transition-all"
                style={{
                  fontFamily:  'var(--font-geist-mono)',
                  background:  active ? '#e94560' : 'transparent',
                  borderColor: active ? '#e94560' : 'rgba(255,255,255,0.08)',
                  color:       active ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <span className="text-[11px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3">
            <span className="text-4xl">📅</span>
            <p className="text-[12px] text-white/20" style={{ fontFamily: 'var(--font-geist-mono)' }}>
              {proteinFilter === 'all' ? 'No menus yet' : 'No menus with this protein'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(menu => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onClick={() => { setSelectedMenu(menu); setView('detail') }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MenuCard ───────────────────────────────────────────────────────────────

const PROTEIN_LABEL: Record<string, string> = {
  kjott:   'Kjøtt',
  kylling: 'Kylling',
  fisk:    'Fisk',
  vegetar: 'Vegetar',
}

function MenuCard({ menu, onClick }: { menu: MenuWithRecipes; onClick: () => void }) {
  const slots = Array.from({ length: 4 }, (_, i) => menu.recipes[i] ?? null)

  return (
    <button
      onClick={onClick}
      style={{
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        overflow:     'hidden',
        cursor:       'pointer',
        textAlign:    'left',
        width:        '100%',
        padding:      0,
      }}
    >
      {/* 2×2 image grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: 160 }}>
        {slots.map((recipe, i) => (
          <div key={i} style={{ background: '#111', overflow: 'hidden', position: 'relative' }}>
            {recipe?.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.25 }}>
                🍽️
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              color:        '#fff',
              fontSize:     16,
              fontWeight:   700,
              fontFamily:   'var(--font-geist-sans)',
              flex:         1,
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {menu.name}
          </span>
          {menu.is_active && (
            <span style={{ background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#52b788', fontFamily: 'var(--font-geist-mono)', flexShrink: 0 }}>
              Active
            </span>
          )}
          {menu.dominant_protein && (
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', flexShrink: 0 }}>
              {PROTEIN_LABEL[menu.dominant_protein] ?? menu.dominant_protein}
            </span>
          )}
        </div>

        {/* Recipe names */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menu.recipes.slice(0, 4).map(r => (
            <span
              key={r.id}
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'var(--font-geist-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {r.title}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
