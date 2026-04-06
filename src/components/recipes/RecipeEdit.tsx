'use client'

import React, { useState } from 'react'
import type { Recipe, NewRecipe, RecipeCategory } from '../../../types/recipe'
import { RecipeIcon } from '../../../lib/recipe-icons'
import ImagePickerSheet from './ImagePickerSheet'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ACCENT: Record<RecipeCategory, string> = {
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  dinner: '🍽️', breakfast: '☀️', baking: '🍞', dessert: '🍮', other: '🥄',
}

const PROTEIN_OPTIONS: Array<{ value: NonNullable<Recipe['protein_type']>; label: string }> = [
  { value: 'kjott',   label: 'Kjøtt'   },
  { value: 'kylling', label: 'Kylling' },
  { value: 'fisk',    label: 'Fisk'    },
  { value: 'vegetar', label: 'Vegetar' },
]

const METHOD_OPTIONS = ['pan', 'oven', 'pot', 'one-pan', 'grill', 'wok', 'no-cook']

const CATEGORY_OPTIONS: RecipeCategory[] = ['dinner', 'breakfast', 'baking', 'dessert', 'other']

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecipeEditProps {
  recipe:   Recipe
  onSave:   (updates: Partial<NewRecipe>) => Promise<void>
  onCancel: () => void
  onDelete: () => Promise<void>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RecipeEdit({ recipe, onSave, onCancel, onDelete }: RecipeEditProps) {
  const [draft,             setDraft]             = useState<Recipe>({ ...recipe })
  const [showImagePicker,   setShowImagePicker]   = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving,            setSaving]            = useState(false)
  const [deleting,          setDeleting]          = useState(false)

  const accent = CATEGORY_ACCENT[draft.category] ?? CATEGORY_ACCENT.other
  const hasHeroPhoto = !!draft.image_url

  // ── Draft helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  // ── Image ──────────────────────────────────────────────────────────────────

  async function handlePickFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/recipes/${recipe.id}/image`, {
      method: 'POST',
      body:   formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    const { image_url } = await res.json()
    setDraft(d => ({ ...d, image_url, image_icon: undefined }))
  }

  // ── Ingredients ────────────────────────────────────────────────────────────

  function updateIngredient(i: number, patch: Partial<Recipe['ingredients'][0]>) {
    setDraft(d => {
      const ingredients = [...d.ingredients]
      ingredients[i] = { ...ingredients[i], ...patch }
      return { ...d, ingredients }
    })
  }

  function removeIngredient(i: number) {
    setDraft(d => ({ ...d, ingredients: d.ingredients.filter((_, idx) => idx !== i) }))
  }

  function moveIngredient(i: number, dir: -1 | 1) {
    setDraft(d => {
      const arr = [...d.ingredients]
      const j   = i + dir
      if (j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, ingredients: arr }
    })
  }

  function addIngredient() {
    setDraft(d => ({
      ...d,
      ingredients: [...d.ingredients, { name: '', amount: 1, unit: '', notes: undefined }],
    }))
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  function updateStep(i: number, patch: Partial<Recipe['steps'][0]>) {
    setDraft(d => {
      const steps = [...d.steps]
      steps[i] = { ...steps[i], ...patch }
      return { ...d, steps }
    })
  }

  function removeStep(i: number) {
    setDraft(d => ({
      ...d,
      steps: d.steps
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, order: idx + 1 })),
    }))
  }

  function moveStep(i: number, dir: -1 | 1) {
    setDraft(d => {
      const arr = [...d.steps]
      const j   = i + dir
      if (j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return {
        ...d,
        steps: arr.map((s, idx) => ({ ...s, order: idx + 1 })),
      }
    })
  }

  function addStep() {
    setDraft(d => ({
      ...d,
      steps: [...d.steps, { order: d.steps.length + 1, instruction: '', ingredients_used: [] }],
    }))
  }

  // ── Save / Delete ──────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, ...updates } = draft
      await onSave(updates)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-48" style={{ background: 'var(--color-bg)' }}>

      {/* ── Hero ── */}
      <div className="relative h-72 overflow-hidden">
        {draft.image_url ? (
          <div className="absolute inset-0" style={{ background: '#1a0508' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.image_url}
              alt={draft.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : draft.image_icon ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--color-subtle)' }}
          >
            <RecipeIcon icon={draft.image_icon} color={accent} size={80} />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--color-subtle)' }}
          >
            <span className="text-[80px] opacity-20" style={{ color: 'var(--color-text-dim)' }}>{CATEGORY_EMOJI[draft.category]}</span>
          </div>
        )}

        {hasHeroPhoto && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.38) 48%, rgba(0,0,0,0.93) 100%)',
            }}
          />
        )}

        {/* Change image button */}
        <button
          onClick={() => setShowImagePicker(true)}
          className="absolute right-4 top-4 rounded-lg border px-3 py-1.5 text-[11px] transition-colors"
          style={{
            background:    hasHeroPhoto ? 'rgba(0,0,0,0.45)' : 'var(--color-surface)',
            backdropFilter: hasHeroPhoto ? 'blur(8px)' : undefined,
            borderColor:   'var(--color-border)',
            color:         hasHeroPhoto ? '#fff' : 'var(--color-text)',
            fontFamily:    'var(--font-geist-mono)',
          }}
        >
          Change image
        </button>

        {/* Editable title */}
        <div className="absolute bottom-5 left-5 right-5">
          <input
            value={draft.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Recipe title"
            className={`w-full bg-transparent font-bold leading-tight focus:outline-none ${hasHeroPhoto ? 'text-white placeholder:text-[color:var(--color-text-dim)]' : 'text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-dim)]'}`}
            style={{
              fontFamily:  'var(--font-geist-sans)',
              textShadow:  hasHeroPhoto ? '0 2px 8px rgba(0,0,0,0.6)' : 'none',
              fontSize:    26,
            }}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-2xl px-5 pt-6 space-y-6">

        {/* Protein type */}
        <div>
          <SectionLabel>
            Protein type
            {!draft.protein_type && (
              <span
                className="ml-2 text-[10px]"
                style={{ color: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
              >
                ⚠ Required for menu builder
              </span>
            )}
          </SectionLabel>
          <PillSelector
            options={PROTEIN_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
            value={draft.protein_type ?? null}
            onChange={v => set('protein_type', (v ?? undefined) as Recipe['protein_type'])}
            accent="#f4a261"
            nullable
          />
        </div>

        {/* Category */}
        <div>
          <SectionLabel>Category</SectionLabel>
          <PillSelector
            options={CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))}
            value={draft.category}
            onChange={v => v && set('category', v as RecipeCategory)}
            getAccent={v => CATEGORY_ACCENT[v as RecipeCategory] ?? '#f4a261'}
          />
        </div>

        {/* Cooking method */}
        <div>
          <SectionLabel>Cooking method</SectionLabel>
          <MultiPillSelector
            options={METHOD_OPTIONS.map(m => ({ value: m, label: m }))}
            values={draft.cooking_method
              ? draft.cooking_method.split(',').map(s => s.trim()).filter(Boolean)
              : []}
            onChange={vals => set('cooking_method', vals.length > 0 ? vals.join(',') : undefined)}
            accent={accent}
          />
        </div>

        {/* Description */}
        <div>
          <SectionLabel>Description</SectionLabel>
          <textarea
            value={draft.description ?? ''}
            onChange={e => set('description', e.target.value || undefined)}
            placeholder="Brief description…"
            rows={3}
            className="w-full rounded-xl border px-4 py-3 focus:outline-none resize-none"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-geist-sans)', fontSize: 16 }}
          />
        </div>

        {/* Timing */}
        <div>
          <SectionLabel>Timing</SectionLabel>
          <div className="space-y-2">
            <EditableNumber
              label="Servings"
              value={draft.servings}
              min={1}
              onChange={v => set('servings', v ?? 1)}
            />
            <EditableNumber
              label="Prep (min)"
              value={draft.prep_time_minutes ?? null}
              min={0}
              onChange={v => set('prep_time_minutes', v ?? undefined)}
              nullable
            />
            <EditableNumber
              label="Cook (min)"
              value={draft.cook_time_minutes ?? null}
              min={0}
              onChange={v => set('cook_time_minutes', v ?? undefined)}
              nullable
            />
          </div>
        </div>

        {/* Cuisine */}
        <div>
          <SectionLabel>Cuisine</SectionLabel>
          <input
            value={draft.cuisine ?? ''}
            onChange={e => set('cuisine', e.target.value || undefined)}
            placeholder="e.g. Italian, Norwegian, Mexican…"
            className="w-full rounded-xl border px-4 py-3 focus:outline-none"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-geist-mono)', fontSize: 16 }}
          />
        </div>

        {/* Ingredients */}
        <div>
          <SectionLabel>Ingredients ({draft.ingredients.length})</SectionLabel>
          <div className="space-y-2">
            {draft.ingredients.map((ing, i) => (
              <div
                key={i}
                className="rounded-2xl border p-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                {/* Main row */}
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveIngredient(i, -1)}
                      disabled={i === 0}
                      className="text-[10px] hover:opacity-70 disabled:opacity-20 leading-none"
                      style={{ color: 'var(--color-text-dim)' }}
                    >▲</button>
                    <button
                      onClick={() => moveIngredient(i, 1)}
                      disabled={i === draft.ingredients.length - 1}
                      className="text-[10px] hover:opacity-70 disabled:opacity-20 leading-none"
                      style={{ color: 'var(--color-text-dim)' }}
                    >▼</button>
                  </div>

                  {/* Name */}
                  <input
                    value={ing.name}
                    onChange={e => updateIngredient(i, { name: e.target.value })}
                    placeholder="Ingredient"
                    className="flex-1 min-w-0 bg-transparent focus:outline-none border-b pb-1"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-sans)', fontSize: 16 }}
                  />

                  {/* Amount */}
                  <input
                    type="number"
                    value={ing.amount}
                    min={0}
                    step="any"
                    onChange={e => updateIngredient(i, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-14 bg-transparent text-right focus:outline-none border-b pb-1"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-mono)', fontSize: 16 }}
                  />

                  {/* Unit */}
                  <input
                    value={ing.unit}
                    onChange={e => updateIngredient(i, { unit: e.target.value })}
                    placeholder="unit"
                    className="w-14 bg-transparent focus:outline-none border-b pb-1"
                    style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-mono)', fontSize: 16 }}
                  />

                  {/* Delete */}
                  <button
                    onClick={() => removeIngredient(i)}
                    className="shrink-0 text-[16px] leading-none hover:text-[#e94560] transition-colors"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    ×
                  </button>
                </div>

                {/* Notes row */}
                <input
                  value={ing.notes ?? ''}
                  onChange={e => updateIngredient(i, { notes: e.target.value || undefined })}
                  placeholder="Notes (optional)"
                  className="mt-2 w-full bg-transparent focus:outline-none pl-6"
                  style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-sans)', fontSize: 16 }}
                />
              </div>
            ))}

            <button
              onClick={addIngredient}
              className="w-full rounded-2xl border-2 border-dashed py-3 text-[11px] uppercase tracking-[0.07em] transition-colors hover:opacity-80"
              style={{ fontFamily: 'var(--font-geist-mono)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
            >
              + Add ingredient
            </button>
          </div>
        </div>

        {/* Steps */}
        <div>
          <SectionLabel>Steps ({draft.steps.length})</SectionLabel>
          <div className="space-y-2">
            {draft.steps.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl border p-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="flex items-start gap-2">
                  {/* Step number */}
                  <span
                    className="shrink-0 mt-1 w-6 text-center text-[10px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--color-text-dim)' }}
                  >
                    {String(step.order).padStart(2, '0')}
                  </span>

                  {/* Instruction */}
                  <textarea
                    value={step.instruction}
                    onChange={e => updateStep(i, { instruction: e.target.value })}
                    placeholder="Step instruction…"
                    rows={2}
                    className="flex-1 bg-transparent leading-snug focus:outline-none resize-none"
                    style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)', fontSize: 16 }}
                  />

                  {/* Reorder + delete */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <button
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="text-[10px] hover:opacity-70 disabled:opacity-20 leading-none"
                      style={{ color: 'var(--color-text-dim)' }}
                    >▲</button>
                    <button
                      onClick={() => removeStep(i)}
                      className="text-[16px] leading-none hover:text-[#e94560] transition-colors"
                      style={{ color: 'var(--color-text-dim)' }}
                    >×</button>
                    <button
                      onClick={() => moveStep(i, 1)}
                      disabled={i === draft.steps.length - 1}
                      className="text-[10px] hover:opacity-70 disabled:opacity-20 leading-none"
                      style={{ color: 'var(--color-text-dim)' }}
                    >▼</button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addStep}
              className="w-full rounded-2xl border-2 border-dashed py-3 text-[11px] uppercase tracking-[0.07em] transition-colors hover:opacity-80"
              style={{ fontFamily: 'var(--font-geist-mono)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
            >
              + Add step
            </button>
          </div>
        </div>

        {/* Delete recipe — inside scroll area, not in footer */}
        <div className="pt-2 pb-6">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-2xl border border-[#e94560]/30 py-4 text-[13px] tracking-[0.04em] text-[#e94560]/60 hover:border-[#e94560]/60 hover:text-[#e94560] transition-colors"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Delete recipe
          </button>
        </div>

      </div>

      {/* ── Sticky footer (bottom: 64 clears BottomNav) ── */}
      <div
        className="fixed left-0 right-0 px-5 pt-3 pb-4 border-t"
        style={{
          bottom:          64,
          borderColor:     'var(--color-border)',
          background:      'color-mix(in srgb, var(--color-bg) 96%, transparent)',
          backdropFilter:  'blur(16px)',
        }}
      >
        <div className="mx-auto max-w-2xl flex gap-3">
          <button
            onClick={onCancel}
            className="w-24 shrink-0 rounded-2xl border py-4 text-[13px] transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-geist-mono)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: draft.protein_type ? '#52b788' : '#f4a261',
              fontFamily: 'var(--font-geist-mono)',
            }}
          >
            {saving
              ? 'Saving…'
              : draft.protein_type
                ? 'Save changes'
                : 'Save (protein type missing)'}
          </button>
        </div>
      </div>

      {/* ── Image picker ── */}
      {showImagePicker && (
        <ImagePickerSheet
          currentUrl={draft.image_url}
          currentIcon={draft.image_icon}
          onClose={() => setShowImagePicker(false)}
          onPickUrl={url  => setDraft(d => ({ ...d, image_url: url, image_icon: undefined }))}
          onPickIcon={icon => setDraft(d => ({ ...d, image_icon: icon, image_url: undefined }))}
          onPickFile={handlePickFile}
        />
      )}

      {/* ── Delete confirm ── */}
      {showDeleteConfirm && (
        <DeleteConfirmSheet
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      )}

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[10px] uppercase tracking-[0.1em]"
      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
    >
      {children}
    </p>
  )
}

interface PillSelectorProps {
  options:    { value: string; label: string }[]
  value:      string | null
  onChange:   (value: string | null) => void
  accent?:    string
  getAccent?: (value: string) => string
  nullable?:  boolean
}

function PillSelector({
  options,
  value,
  onChange,
  accent = '#f4a261',
  getAccent,
  nullable,
}: PillSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active     = value === opt.value
        const thisAccent = getAccent ? getAccent(opt.value) : accent
        return (
          <button
            key={opt.value}
            onClick={() => onChange(active && nullable ? null : opt.value)}
            className="rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.07em] transition-all"
            style={{
              fontFamily:  'var(--font-geist-mono)',
              background:  active ? thisAccent : 'transparent',
              borderColor: active ? thisAccent : 'var(--color-border)',
              color:       active ? '#0a0a0a'  : 'var(--color-text-dim)',
              fontWeight:  active ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface MultiPillSelectorProps {
  options:  { value: string; label: string }[]
  values:   string[]
  onChange: (values: string[]) => void
  accent?:  string
}

function MultiPillSelector({
  options,
  values,
  onChange,
  accent = '#f4a261',
}: MultiPillSelectorProps) {
  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value))
    } else {
      onChange([...values, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = values.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.07em] transition-all"
            style={{
              fontFamily:  'var(--font-geist-mono)',
              background:  active ? accent : 'transparent',
              borderColor: active ? accent : 'var(--color-border)',
              color:       active ? '#0a0a0a' : 'var(--color-text-dim)',
              fontWeight:  active ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface EditableNumberProps {
  label:     string
  value:     number | null
  min:       number
  onChange:  (value: number | null) => void
  nullable?: boolean
}

function EditableNumber({ label, value, min, onChange, nullable }: EditableNumberProps) {
  const [editing, setEditing] = useState(false)
  const [raw,     setRaw]     = useState('')

  function startEdit() {
    setRaw(value != null ? String(value) : '')
    setEditing(true)
  }

  function commitEdit() {
    const n = parseInt(raw)
    if (isNaN(n)) {
      onChange(nullable ? null : min)
    } else {
      onChange(Math.max(min, n))
    }
    setEditing(false)
  }

  function adjust(delta: number) {
    const next = Math.max(min, (value ?? 0) + delta)
    onChange(next)
  }

  return (
    <div
      className="flex items-center justify-between rounded-xl border px-4 py-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <span
        className="text-[12px]"
        style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjust(-1)}
          disabled={value != null && value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-20"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
        >
          −
        </button>

        {editing ? (
          <input
            autoFocus
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            className="w-12 bg-transparent text-center font-semibold focus:outline-none border-b"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-mono)', fontSize: 18 }}
          />
        ) : (
          <button
            onClick={startEdit}
            className="w-12 text-center text-[18px] font-semibold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-mono)' }}
          >
            {value ?? '—'}
          </button>
        )}

        <button
          onClick={() => adjust(1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
        >
          +
        </button>
      </div>
    </div>
  )
}

interface DeleteConfirmSheetProps {
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}

function DeleteConfirmSheet({ onConfirm, onCancel, deleting }: DeleteConfirmSheetProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t px-5 pt-4 pb-10"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>
        <p
          className="mb-2 text-center text-[15px] font-semibold"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
        >
          Delete recipe?
        </p>
        <p
          className="mb-8 text-center text-[12px]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
        >
          This cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#e94560', fontFamily: 'var(--font-geist-mono)' }}
          >
            {deleting ? 'Deleting…' : 'Delete recipe'}
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-2xl border py-4 text-[13px] transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-geist-mono)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
