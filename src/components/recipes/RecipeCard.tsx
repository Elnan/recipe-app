'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { Recipe, RecipeCategory } from '../../../types/recipe'
import { RecipeIcon } from '../../../lib/recipe-icons'

const CATEGORY_ACCENT: Record<RecipeCategory, string> = {
  dinner:    '#e94560',
  breakfast: '#f4a261',
  baking:    '#c77dff',
  dessert:   '#48cae4',
  other:     '#52b788',
}

const CATEGORY_BG: Record<RecipeCategory, string> = {
  dinner:    'linear-gradient(135deg, #2a0a0f, #1a0508)',
  breakfast: 'linear-gradient(135deg, #2a1500, #1a0d00)',
  baking:    'linear-gradient(135deg, #1a0a2e, #0f0520)',
  dessert:   'linear-gradient(135deg, #001a20, #000f14)',
  other:     'linear-gradient(135deg, #001a0e, #000f08)',
}

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  dinner:    '🍽️',
  breakfast: '☀️',
  baking:    '🍞',
  dessert:   '🍮',
  other:     '🥄',
}

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-px">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className="text-[10px]"
          style={{ color: s <= rating ? '#f4a261' : 'rgba(255,255,255,0.15)' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const accent = CATEGORY_ACCENT[recipe.category] ?? CATEGORY_ACCENT.other
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)

  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  // Spotlight border: instant tracking on hover, smooth 0.4s fade on leave
  const borderBackground = isHovered
    ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${accent}, transparent 70%)`
    : 'rgba(255,255,255,0.05)'

  const wrapperTransition = isHovered
    ? 'transform 200ms ease-out'
    : 'background 0.4s ease, transform 200ms ease-out'

  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      {/* Spotlight border wrapper — 1px padding lets the gradient show as a border */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="rounded-2xl p-px"
        style={{
          background: borderBackground,
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0px)',
          transition: wrapperTransition,
        }}
      >
        <div
          className="relative flex flex-col justify-end overflow-hidden rounded-[15px] min-h-[220px] cursor-pointer"
        >
          {/* Background: image or coloured placeholder */}
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : recipe.image_icon ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: CATEGORY_BG[recipe.category] ?? CATEGORY_BG.other }}
            >
              <RecipeIcon icon={recipe.image_icon} color={accent} size={52} />
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: CATEGORY_BG[recipe.category] ?? CATEGORY_BG.other }}
            >
              <span className="text-5xl opacity-25">
                {CATEGORY_EMOJI[recipe.category]}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.88) 100%)',
            }}
          />

          {/* Category + cooking method badges — top left */}
          <div className="absolute top-3 left-3 flex items-center gap-[5px]">
            <div
              className="rounded-[5px] px-[9px] py-[3px] text-[9px] font-medium uppercase tracking-[0.09em] text-[#0a0a0a]"
              style={{ background: accent, fontFamily: 'var(--font-geist-mono)' }}
            >
              {CATEGORY_EMOJI[recipe.category]} {recipe.category}
            </div>
            {recipe.cooking_method && (
              <div
                className="rounded-[5px] px-[9px] py-[3px] text-[9px] uppercase tracking-[0.07em] border"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(6px)',
                  borderColor: `${accent}55`,
                  color: accent,
                }}
              >
                {METHOD_META[recipe.cooking_method]?.label ?? recipe.cooking_method}
              </div>
            )}
          </div>

          {/* Menu name badge — top right */}
          {recipe.menu_name && (
            <div
              className="absolute top-3 right-3 rounded-[5px] px-[9px] py-[3px] text-[9px] tracking-[0.06em] border"
              style={{
                fontFamily: 'var(--font-geist-mono)',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                borderColor: `${accent}55`,
                color: accent,
              }}
            >
              {recipe.menu_name}
            </div>
          )}

          {/* Bottom content */}
          <div className="relative px-4 pb-4 pt-[14px]">
            {/* Dietary pills — above title */}
            {recipe.dietary && recipe.dietary.length > 0 && (
              <div className="flex flex-wrap gap-[5px] mb-[7px]">
                {recipe.dietary.map(d => (
                  <div
                    key={d}
                    className="px-[9px] py-[3px] text-[9px] uppercase tracking-[0.07em] border"
                    style={{
                      fontFamily: 'var(--font-geist-mono)',
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.45)',
                      borderRadius: '20px',
                    }}
                  >
                    {DIETARY_META[d]?.label ?? d}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start justify-between mb-[5px]">
              <h3
                className="flex-1 pr-2 text-[18px] font-bold leading-tight text-white"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}
              >
                {recipe.title}
              </h3>
              {recipe.rating != null && <StarRating rating={recipe.rating} />}
            </div>

            {/* Meta row: time, cuisine */}
            <div className="flex items-center gap-3 flex-wrap">
              {totalTime > 0 && (
                <span
                  className="text-[11px] text-white/35"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  ⏱ {totalTime}m
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
        </div>
      </div>
    </Link>
  )
}
