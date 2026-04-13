'use client'

import { useState, useEffect, useRef } from 'react'
import type { NewRecipe, Recipe } from '../../../types/recipe'
import { formatAmount } from '../../../lib/format'
import RecipePreview from './RecipePreview'

interface ImportDrawerProps {
  open:          boolean
  onClose:       () => void
  onSave:        (recipe: NewRecipe) => Promise<void>
  onUpdate?:     (id: string, recipe: NewRecipe) => Promise<void>
  prefillText?:  string
  defaultTab?:   Tab
}

type Tab          = 'url' | 'text' | 'photo'
type DrawerState  = 'input' | 'loading' | 'preview' | 'cached'

// ── Helpers ───────────────────────────────────────────────────────────────────

function resizeImage(file: File, maxPx = 1024): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  })
}

// ── CachedComparison ──────────────────────────────────────────────────────────

interface CachedComparisonProps {
  saved:            Recipe
  reimported:       NewRecipe
  onUseReimported:  () => void
  onKeepSaved:      () => void
}

type DiffField = {
  label:   string
  before:  string
  after:   string
}

function buildDiff(saved: Recipe, reimported: NewRecipe): DiffField[] {
  const changes: DiffField[] = []
  const scale = saved.servings / (reimported.servings || 1)

  // Scalar fields
  const scalars: Array<[string, keyof Recipe & keyof NewRecipe]> = [
    ['Title',          'title'],
    ['Description',    'description'],
    ['Cuisine',        'cuisine'],
    ['Cooking method', 'cooking_method'],
    ['Servings',       'servings'],
    ['Prep time',      'prep_time_minutes'],
    ['Cook time',      'cook_time_minutes'],
  ]
  for (const [label, key] of scalars) {
    const before = String(saved[key] ?? '')
    const after  = String((reimported as Record<string, unknown>)[key] ?? '')
    if (before !== after && (before || after)) {
      changes.push({ label, before, after })
    }
  }

  // Dietary
  const savedDietary      = (saved.dietary ?? []).slice().sort().join(', ')
  const reimportedDietary = (reimported.dietary ?? []).slice().sort().join(', ')
  if (savedDietary !== reimportedDietary) {
    changes.push({ label: 'Dietary', before: savedDietary || '—', after: reimportedDietary || '—' })
  }

  // Ingredients — normalise re-imported amounts to saved serving count
  const savedIngMap = new Map(saved.ingredients.map(i => [i.name.toLowerCase(), i]))
  for (const ing of reimported.ingredients) {
    const key       = ing.name.toLowerCase()
    const savedIng  = savedIngMap.get(key)
    const scaledAmt = parseFloat((ing.amount * scale).toFixed(4))

    if (!savedIng) {
      changes.push({
        label:  `Ingredient: ${ing.name}`,
        before: '—',
        after:  `${formatAmount(scaledAmt)} ${ing.unit}`.trim(),
      })
    } else if (
      Math.abs(savedIng.amount - scaledAmt) > 0.04 ||
      savedIng.unit !== ing.unit
    ) {
      changes.push({
        label:  `Ingredient: ${ing.name}`,
        before: `${formatAmount(savedIng.amount)} ${savedIng.unit}`.trim(),
        after:  `${formatAmount(scaledAmt)} ${ing.unit}`.trim(),
      })
    }
  }
  // Removed ingredients
  const reimportedNames = new Set(reimported.ingredients.map(i => i.name.toLowerCase()))
  for (const ing of saved.ingredients) {
    if (!reimportedNames.has(ing.name.toLowerCase())) {
      changes.push({
        label:  `Ingredient: ${ing.name}`,
        before: `${formatAmount(ing.amount)} ${ing.unit}`.trim(),
        after:  '— removed',
      })
    }
  }

  // Steps — compare by order
  const savedStepMap = new Map(saved.steps.map(s => [s.order, s.instruction]))
  for (const step of reimported.steps) {
    const savedText = savedStepMap.get(step.order)
    if (savedText === undefined) {
      changes.push({ label: `Step ${step.order}`, before: '—', after: step.instruction })
    } else if (savedText !== step.instruction) {
      changes.push({ label: `Step ${step.order}`, before: savedText, after: step.instruction })
    }
  }

  return changes
}

function CachedComparison({ saved, reimported, onUseReimported, onKeepSaved }: CachedComparisonProps) {
  const [viewMode, setViewMode]   = useState<'diff' | 'full'>('diff')
  const [fullSide, setFullSide]   = useState<'saved' | 'reimported'>('reimported')
  const scale                     = saved.servings / (reimported.servings || 1)
  const diff                      = buildDiff(saved, reimported)

  const fullRecipe = fullSide === 'saved' ? saved : reimported

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="mb-4">
        <p
          className="text-[13px] font-semibold mb-1"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
        >
          Already imported
        </p>
        <p
          className="text-[11px]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          This URL was imported before. Review what changed.
        </p>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: 'var(--color-surface)' }}>
        {(['diff', 'full'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.07em] transition-colors"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              background: viewMode === mode ? 'var(--color-subtle)' : 'transparent',
              color:      viewMode === mode ? 'var(--color-text)' : 'var(--color-text-dim)',
              fontWeight: viewMode === mode ? 600 : 400,
            }}
          >
            {mode === 'diff' ? 'Changes' : 'Full view'}
          </button>
        ))}
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">

        {/* Diff view */}
        {viewMode === 'diff' && (
          diff.length === 0 ? (
            <div className="flex flex-col items-center pt-10 gap-2">
              <span className="text-2xl">✓</span>
              <p
                className="text-[12px]"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
              >
                No changes detected
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {diff.map((field, i) => (
                <li
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--color-subtle)' }}
                >
                  <p
                    className="text-[9px] uppercase tracking-[0.1em] mb-2"
                    style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {field.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-[12px] line-through"
                      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {field.before}
                    </p>
                    <p
                      className="text-[12px] text-[#52b788]"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {field.after}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* Full view */}
        {viewMode === 'full' && (
          <div>
            {/* Side toggle */}
            <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: 'var(--color-surface)' }}>
              {(['saved', 'reimported'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => setFullSide(side)}
                  className="flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.07em] transition-colors"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    background: fullSide === side ? 'var(--color-subtle)' : 'transparent',
                    color:      fullSide === side ? 'var(--color-text)' : 'var(--color-text-dim)',
                    fontWeight: fullSide === side ? 600 : 400,
                  }}
                >
                  {side === 'saved' ? 'Saved' : 'Re-imported'}
                </button>
              ))}
            </div>

            <ul className="space-y-1">
              {fullRecipe.ingredients.map((ing, i) => {
                const amt = fullSide === 'reimported'
                  ? ing.amount * scale
                  : ing.amount
                return (
                  <li
                    key={i}
                    className="flex items-baseline justify-between rounded-xl px-4 py-3"
                    style={{ background: 'var(--color-subtle)' }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {ing.name}
                    </span>
                    <span
                      className="ml-4 shrink-0 text-[12px]"
                      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {formatAmount(amt)} {ing.unit}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 shrink-0 flex flex-col gap-2">
        <button
          onClick={onUseReimported}
          className="w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-90"
          style={{ background: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
        >
          Use re-imported version
        </button>
        <button
          onClick={onKeepSaved}
          className="w-full rounded-2xl border py-4 text-[13px] tracking-[0.04em] transition-opacity hover:opacity-90"
          style={{
            fontFamily:   'var(--font-geist-mono)',
            borderColor:  'var(--color-border)',
            color:        'var(--color-text-dim)',
          }}
        >
          Keep saved version
        </button>
      </div>
    </div>
  )
}

// ── ImportDrawer ──────────────────────────────────────────────────────────────

export default function ImportDrawer({ open, onClose, onSave, onUpdate, prefillText, defaultTab }: ImportDrawerProps) {
  const [tab,           setTab]           = useState<Tab>('url')
  const [drawerState,   setDrawerState]   = useState<DrawerState>('input')
  const [urlInput,      setUrlInput]      = useState('')
  const [textInput,     setTextInput]     = useState('')
  const [error,         setError]         = useState<string | null>(null)
  const [parsedRecipe,  setParsedRecipe]  = useState<NewRecipe | null>(null)
  const [cachedRecipe,  setCachedRecipe]  = useState<Recipe | null>(null)
  const [photos,        setPhotos]        = useState<File[]>([])
  const [dragOver,      setDragOver]      = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync defaultTab when drawer opens
  useEffect(() => {
    if (open && defaultTab) {
      setTab(defaultTab)
    }
  }, [open, defaultTab])

  // Sync prefillText → text tab
  useEffect(() => {
    if (prefillText) {
      setTextInput(prefillText)
      setTab('text')
    }
  }, [prefillText])

  // Reset state when drawer closes
  function handleClose() {
    onClose()
    // Delay reset so the close animation plays first
    setTimeout(() => {
      setDrawerState('input')
      setError(null)
      setParsedRecipe(null)
      setCachedRecipe(null)
      setUrlInput('')
      setPhotos([])
      if (!prefillText) setTextInput('')
    }, 300)
  }

  // ── URL submit ──────────────────────────────────────────────────────────────

  async function handleUrlSubmit() {
    if (!urlInput.trim()) return
    setError(null)
    setDrawerState('loading')

    try {
      const res  = await fetch('/api/recipes/import/url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Import failed')
        setDrawerState('input')
        return
      }

      if (data.cached) {
        setCachedRecipe(data.recipe)
        setParsedRecipe(null) // will be set after re-import in background — handled via api call below
        // Re-fetch without cache to get re-imported version for comparison
        const reRes  = await fetch('/api/recipes/import/url', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ url: urlInput.trim(), forceReimport: true }),
        })
        // If re-import fails, just use cached
        const reData = reRes.ok ? await reRes.json() : null
        setParsedRecipe(reData?.recipe ?? data.recipe)
        setDrawerState('cached')
      } else {
        setParsedRecipe(data.recipe)
        setDrawerState('preview')
      }
    } catch {
      setError('Network error — check your connection')
      setDrawerState('input')
    }
  }

  // ── Text submit ─────────────────────────────────────────────────────────────

  async function handleTextSubmit() {
    if (!textInput.trim()) return
    setError(null)
    setDrawerState('loading')

    try {
      const res  = await fetch('/api/recipes/import/text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: textInput }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Import failed')
        setDrawerState('input')
        return
      }

      setParsedRecipe(data.recipe)
      setDrawerState('preview')
    } catch {
      setError('Network error — check your connection')
      setDrawerState('input')
    }
  }

  // ── Photo helpers ────────────────────────────────────────────────────────────

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...files].slice(0, 6))
    e.target.value = ''
  }

  async function handlePhotosSubmit() {
    if (photos.length === 0) return
    setError(null)
    setDrawerState('loading')

    try {
      const base64Images = await Promise.all(photos.map(f => resizeImage(f)))
      const res = await fetch('/api/recipes/import/photo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ images: base64Images }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Import failed')
        setDrawerState('input')
        return
      }

      setParsedRecipe(data.recipe)
      setDrawerState('preview')
    } catch {
      setError('Network error — check your connection')
      setDrawerState('input')
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!parsedRecipe) return
    try {
      if (cachedRecipe && onUpdate) {
        await onUpdate(cachedRecipe.id, parsedRecipe)
      } else {
        await onSave(parsedRecipe)
      }
      handleClose()
    } catch {
      setError('Failed to save recipe — please try again')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          background:    'var(--color-surface)',
          borderTop:       '1px solid var(--color-border)',
          maxHeight:       '90vh',
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        <div className="px-5 pt-2 pb-8 flex flex-col flex-1 min-h-0">

          {/* Top row: title + close */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
            >
              {drawerState === 'cached' ? 'Already imported' : 'Import recipe'}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex items-center justify-center rounded-full border cursor-pointer flex-shrink-0 w-[44px] h-[44px] md:w-[36px] md:h-[36px] text-lg md:text-base transition-opacity hover:opacity-80"
              style={{
                background:  'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color:         'var(--color-text-dim)',
                fontFamily:    'var(--font-geist-mono)',
              }}
            >
              ×
            </button>
          </div>

          {/* ── Input state ── */}
          {drawerState === 'input' && (
            <>
              {/* Tab bar */}
              <div className="flex gap-1 rounded-xl p-1 mb-5 shrink-0" style={{ background: 'var(--color-surface)' }}>
                {(['url', 'text', 'photo'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null) }}
                    className="flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.07em] transition-colors"
                    style={{
                      fontFamily: 'var(--font-geist-mono)',
                      background: tab === t ? 'var(--color-subtle)' : 'transparent',
                      color:      tab === t ? 'var(--color-text)' : 'var(--color-text-dim)',
                      fontWeight: tab === t ? 600 : 400,
                    }}
                  >
                    {t === 'url' ? 'URL' : t === 'text' ? 'Text' : 'Photo'}
                  </button>
                ))}
              </div>

              {/* URL tab */}
              {tab === 'url' && (
                <div className="flex flex-col gap-3">
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://..."
                    className="w-full rounded-xl border px-4 py-3 text-[13px] placeholder:text-[color:var(--color-text-dim)] focus:outline-none focus:border-[color:var(--color-border)]"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-mono)' }}
                  />
                  {error && <ErrorNote message={error} />}
                  <SubmitButton label="Import →" onClick={handleUrlSubmit} disabled={!urlInput.trim()} />
                </div>
              )}

              {/* Text tab */}
              {tab === 'text' && (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Paste recipe text or Instagram caption…"
                    rows={7}
                    className="w-full rounded-xl border px-4 py-3 text-[13px] placeholder:text-[color:var(--color-text-dim)] focus:outline-none focus:border-[color:var(--color-border)] resize-none"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-sans)' }}
                  />
                  {error && <ErrorNote message={error} />}
                  <SubmitButton label="Parse →" onClick={handleTextSubmit} disabled={!textInput.trim()} />
                </div>
              )}

              {/* Photo tab */}
              {tab === 'photo' && (
                <div className="flex flex-col gap-3">
                  {/* Drop zone — shown when no photos selected */}
                  {photos.length === 0 && (
                    <div
                      className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors cursor-pointer"
                      style={{
                        background: dragOver ? 'rgba(244,162,97,0.04)' : 'transparent',
                        borderColor: dragOver ? 'rgba(244,162,97,0.6)' : 'var(--color-border)',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => {
                        e.preventDefault()
                        setDragOver(false)
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                        if (files.length > 0) setPhotos(prev => [...prev, ...files].slice(0, 6))
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p
                        className="text-[12px] text-center"
                        style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                      >
                        Drop images here or tap to select (max 6)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        onChange={handlePhotoSelect}
                      />
                    </div>
                  )}

                  {/* Thumbnail row — shown when photos selected */}
                  {photos.length > 0 && (
                    <>
                      <div style={{
                        display: 'flex', gap: 8, overflowX: 'auto',
                        padding: '8px 0', scrollbarWidth: 'none',
                      }}>
                        {photos.map((file, i) => (
                          <div key={`${file.name}-${i}`} style={{
                            position: 'relative', flexShrink: 0,
                            width: 72, height: 72, borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                          }}>
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                              style={{
                                position: 'absolute', top: 4, right: 4,
                                width: 20, height: 20, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)', border: 'none',
                                color: '#fff', fontSize: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', lineHeight: 1,
                              }}
                            >×</button>
                          </div>
                        ))}
                        {photos.length < 6 && (
                          <label style={{
                            flexShrink: 0, width: 72, height: 72,
                            borderRadius: 10, border: '2px dashed var(--color-border)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer',
                            color: 'var(--color-text-dim)', fontSize: 24,
                          }}>
                            +
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                              style={{ display: 'none' }}
                              onChange={handlePhotoSelect} />
                          </label>
                        )}
                      </div>
                      <SubmitButton label="Import →" onClick={handlePhotosSubmit} disabled={photos.length === 0} />
                    </>
                  )}

                  {error && <ErrorNote message={error} />}
                </div>
              )}
            </>
          )}

          {/* ── Loading state ── */}
          {drawerState === 'loading' && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--color-border)', borderTopColor: '#f4a261' }}
              />
              <p
                className="text-[11px]"
                style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
              >
                Parsing recipe…
              </p>
            </div>
          )}

          {/* ── Preview state ── */}
          {drawerState === 'preview' && parsedRecipe && (
            <div className="flex flex-col flex-1 min-h-0">
              <RecipePreview
                recipe={parsedRecipe}
                onSave={handleSave}
                onBack={() => setDrawerState('input')}
              />
            </div>
          )}

          {/* ── Cached state ── */}
          {drawerState === 'cached' && cachedRecipe && parsedRecipe && (
            <div className="flex flex-col flex-1 min-h-0">
              <CachedComparison
                saved={cachedRecipe}
                reimported={parsedRecipe}
                onUseReimported={handleSave}
                onKeepSaved={handleClose}
              />
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ── Small shared UI pieces ────────────────────────────────────────────────────

function SubmitButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
      style={{ background: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
    >
      {label}
    </button>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      className="text-[11px] text-[#e94560]/80 px-1"
      style={{ fontFamily: 'var(--font-geist-mono)' }}
    >
      {message}
    </p>
  )
}
