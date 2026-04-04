'use client'

import { useState } from 'react'
import type { NewRecipe } from '../../../types/recipe'
import { formatAmount } from '../../../lib/format'

interface RecipePreviewProps {
  recipe:  NewRecipe
  onSave:  () => void
  onBack:  () => void
}


export default function RecipePreview({ recipe, onSave, onBack }: RecipePreviewProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients')

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          ← Back
        </button>
        <span
          className="text-[10px] uppercase tracking-[0.08em] text-white/25"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Preview
        </span>
      </div>

      {/* AI notice */}
      <div
        className="mb-4 rounded-xl border border-[#f4a261]/20 px-4 py-3 text-[11px] text-[#f4a261]/70 leading-relaxed"
        style={{ background: 'rgba(244,162,97,0.06)', fontFamily: 'var(--font-geist-mono)' }}
      >
        AI-parsed — check ingredients and steps before saving
      </div>

      {/* Title + meta */}
      <div className="mb-4">
        <h2
          className="text-[20px] font-bold leading-tight mb-1"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
        >
          {recipe.title}
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          {recipe.servings > 0 && (
            <span
              className="text-[11px] text-white/35"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {recipe.servings} servings
            </span>
          )}
          {recipe.prep_time_minutes != null && (
            <span
              className="text-[11px] text-white/35"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              prep {recipe.prep_time_minutes}m
            </span>
          )}
          {recipe.cook_time_minutes != null && (
            <span
              className="text-[11px] text-white/35"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              cook {recipe.cook_time_minutes}m
            </span>
          )}
          {recipe.cuisine && (
            <span
              className="text-[11px] text-white/35"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {recipe.cuisine}
            </span>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: 'var(--color-surface)' }}>
        {(['ingredients', 'steps'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.07em] transition-colors"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              background: activeTab === tab ? '#f4a261' : 'transparent',
              color:      activeTab === tab ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === 'ingredients'
              ? `Ingredients (${recipe.ingredients.length})`
              : `Steps (${recipe.steps.length})`}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {activeTab === 'ingredients' && (
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span
                  className="text-[13px]"
                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                >
                  {ing.name}
                  {ing.notes && (
                    <span className="ml-1.5 text-[11px] text-white/30">{ing.notes}</span>
                  )}
                </span>
                <span
                  className="ml-4 shrink-0 text-[12px] text-white/50"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {formatAmount(ing.amount)} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'steps' && (
          <ol className="space-y-2">
            {recipe.steps.map(step => (
              <li
                key={step.order}
                className="flex gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span
                  className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-white/20 mt-0.5"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {String(step.order).padStart(2, '0')}
                </span>
                <p
                  className="text-[13px] leading-snug"
                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
                >
                  {step.instruction}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        className="mt-4 shrink-0 w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-90"
        style={{ background: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
      >
        Save recipe →
      </button>
    </div>
  )
}
