import React from 'react'

export type RecipeIconKey =
  | 'pasta' | 'soup'  | 'meat'       | 'chicken' | 'fish'
  | 'salad' | 'eggs'  | 'bread'      | 'vegetarian' | 'dessert'
  | 'tacos' | 'curry' | 'pizza'      | 'stew'

export const RECIPE_ICON_KEYS: RecipeIconKey[] = [
  'pasta', 'soup', 'meat', 'chicken', 'fish', 'salad',
  'eggs', 'bread', 'vegetarian', 'dessert', 'tacos', 'curry',
  'pizza', 'stew',
]

export const RECIPE_ICON_LABELS: Record<RecipeIconKey, string> = {
  pasta:      'Pasta',
  soup:       'Soup',
  meat:       'Meat',
  chicken:    'Chicken',
  fish:       'Fish',
  salad:      'Salad',
  eggs:       'Eggs',
  bread:      'Bread',
  vegetarian: 'Vegetarian',
  dessert:    'Dessert',
  tacos:      'Tacos',
  curry:      'Curry',
  pizza:      'Pizza',
  stew:       'Stew',
}

// SVG path data — placeholder strokes, swap later from approved artifact
const ICON_PATHS: Record<RecipeIconKey, React.ReactNode> = {
  // Pasta — bowl with wavy noodles
  pasta: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M4 13c0 4 1.8 6 8 6s8-2 8-6' }),
    React.createElement('path', { d: 'M2 13h20' }),
    React.createElement('path', { d: 'M8 13c0-3 1-5 4-5s4 2 4 5' }),
    React.createElement('path', { d: 'M7 8c1-1.5 2.5-2 5-2' }),
  ),

  // Soup — bowl with steam lines
  soup: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M4 12h16l-2 7H6l-2-7z' }),
    React.createElement('path', { d: 'M2 12h20' }),
    React.createElement('path', { d: 'M8 8c0-2 1-3 1-4' }),
    React.createElement('path', { d: 'M12 7c0-2 1-3 1-4' }),
    React.createElement('path', { d: 'M16 8c0-2 1-3 1-4' }),
  ),

  // Meat — steak silhouette
  meat: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M5 12c-1-3 0-6 3-7s7 0 9 2 2 5 0 7-4 3-7 3-4-2-5-5z' }),
    React.createElement('path', { d: 'M9 10c1-1 3-1 4 0' }),
    React.createElement('line', { x1: '17', y1: '7', x2: '20', y2: '4' }),
  ),

  // Chicken — drumstick
  chicken: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M9 4c-3 0-5 2-5 5s2 4 4 4l6 7 2-2-7-6c1-1 2-3 1-5-1-1-1-3-1-3z' }),
    React.createElement('circle', { cx: '16', cy: '17', r: '2' }),
  ),

  // Fish — simple fish body with tail
  fish: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M20 12c0 0-4-6-10-6S4 12 4 12s4 6 10 6 6-6 6-6z' }),
    React.createElement('path', { d: 'M4 12l-3-4v8l3-4z' }),
    React.createElement('circle', { cx: '15', cy: '10', r: '1', fill: 'currentColor' }),
  ),

  // Salad — bowl with leaves
  salad: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M5 12h14l-1 5H6l-1-5z' }),
    React.createElement('path', { d: 'M3 12h18' }),
    React.createElement('path', { d: 'M9 12c-1-3 0-6 3-6 0 2-1 4-3 6z' }),
    React.createElement('path', { d: 'M15 12c1-3 0-6-3-6 0 2 1 4 3 6z' }),
    React.createElement('path', { d: 'M12 12V7' }),
  ),

  // Eggs — two eggs in pan
  eggs: React.createElement(React.Fragment, null,
    React.createElement('ellipse', { cx: '9', cy: '13', rx: '3', ry: '4' }),
    React.createElement('circle', { cx: '9', cy: '12', r: '1.5', fill: 'currentColor', stroke: 'none' }),
    React.createElement('ellipse', { cx: '15', cy: '13', rx: '3', ry: '4' }),
    React.createElement('circle', { cx: '15', cy: '12', r: '1.5', fill: 'currentColor', stroke: 'none' }),
    React.createElement('path', { d: 'M3 17h18' }),
    React.createElement('path', { d: 'M3 17v1h18v-1' }),
  ),

  // Bread — loaf with scored top
  bread: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M4 12c0-4 2-7 8-7s8 3 8 7v6H4v-6z' }),
    React.createElement('path', { d: 'M8 8c0 0 1 2 4 2s4-2 4-2' }),
    React.createElement('line', { x1: '4', y1: '18', x2: '20', y2: '18' }),
  ),

  // Vegetarian — leaf
  vegetarian: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M12 3c0 0-8 3-8 10 0 4 3 7 8 8 5-1 8-4 8-8 0-7-8-10-8-10z' }),
    React.createElement('path', { d: 'M12 21V11' }),
    React.createElement('path', { d: 'M12 15c-2-2-4-2-5-1' }),
    React.createElement('path', { d: 'M12 13c2-2 4-2 5-1' }),
  ),

  // Dessert — cupcake
  dessert: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M8 14l1 5h6l1-5H8z' }),
    React.createElement('path', { d: 'M7 14h10' }),
    React.createElement('path', { d: 'M7 14c0-2 0-4 5-4s5 2 5 4' }),
    React.createElement('path', { d: 'M10 10c0-1 0-3 2-4 2 1 2 3 2 4' }),
    React.createElement('path', { d: 'M12 6V4' }),
  ),

  // Tacos — folded shell with filling
  tacos: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M4 17c0 0 2-10 8-10s8 10 8 10H4z' }),
    React.createElement('path', { d: 'M9 12c1-1 3-1 5 0' }),
    React.createElement('path', { d: 'M10 14c0.5-0.5 2-0.5 3 0' }),
  ),

  // Curry — bowl with rice mound
  curry: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M5 14h14l-1 5H6l-1-5z' }),
    React.createElement('path', { d: 'M3 14h18' }),
    React.createElement('path', { d: 'M8 14c0-3 1.5-5 4-5s4 2 4 5' }),
    React.createElement('path', { d: 'M15 9c1-2 3-2 4-1' }),
  ),

  // Pizza — slice with toppings
  pizza: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M12 3L3 20h18L12 3z' }),
    React.createElement('path', { d: 'M5.5 16h13' }),
    React.createElement('circle', { cx: '10', cy: '14', r: '1', fill: 'currentColor', stroke: 'none' }),
    React.createElement('circle', { cx: '14', cy: '13', r: '1', fill: 'currentColor', stroke: 'none' }),
    React.createElement('circle', { cx: '12', cy: '17', r: '1', fill: 'currentColor', stroke: 'none' }),
  ),

  // Stew — pot with lid and handles
  stew: React.createElement(React.Fragment, null,
    React.createElement('path', { d: 'M6 11h12v8H6z' }),
    React.createElement('path', { d: 'M4 11h16' }),
    React.createElement('path', { d: 'M8 11V9h8v2' }),
    React.createElement('path', { d: 'M4 13H2' }),
    React.createElement('path', { d: 'M20 13h2' }),
    React.createElement('path', { d: 'M10 8c0-1 0-2 2-3 2 1 2 2 2 3' }),
  ),
}

// ── Component ──────────────────────────────────────────────────────────────

export interface RecipeIconProps {
  icon:   RecipeIconKey
  color?: string
  size?:  number
}

export function RecipeIcon({ icon, color = '#f0ede8', size = 48 }: RecipeIconProps) {
  return React.createElement(
    'svg',
    {
      width:           size,
      height:          size,
      viewBox:         '0 0 24 24',
      fill:            'none',
      stroke:          color,
      strokeWidth:     1.5,
      strokeLinecap:   'round' as const,
      strokeLinejoin:  'round' as const,
    },
    ICON_PATHS[icon],
  )
}
