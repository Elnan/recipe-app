# Design Decisions

## Search button — Recipe List

**Pattern:** FAB circle that stretches into a search bar

**Closed state:**
- Shape: circle, 40×40px
- Background: #5a6b42 (olive)
- Border: 1.5px solid #5a6b42
- Border-radius: 20px (fixed, not 50%)
- Icon: ⌕ white, 18px
- Position: fixed bottom-right, above BottomNav (bottom: 62px, right: 14px)
- Shadow: 0 2px 8px rgba(0,0,0,0.18)

**Open state:**
- Shape: pill stretching leftward, right edge stays at same position
- Width: 256px
- Border-radius: 12px
- Background: #ffffff
- Border: 1.5px solid #5a6b42
- Right cap: olive circle (40×40) with ✕ icon, white
- Input: DM Sans 12px, color #1a1a16
- Placeholder: rgba(26,26,22,0.35)
- Left content: ⌕ icon (olive, 12px) + input + optional ✕ clear + filter icon (SVG funnel)
- Filter icon: 3 horizontal lines SVG, 12px, olive, tapping opens filter drawer

**Animation — OPEN:**
- width: 0.30s cubic-bezier(0.4,0,0.2,1)
- border-radius: 0.30s cubic-bezier(0.4,0,0.2,1)
- background + border: 0.20s ease
- Content fades IN after 220ms delay, 0.12s opacity

**Animation — CLOSE (confirmed quicker):**
- Content fades OUT immediately (0.10s opacity)
- width: 0.18s cubic-bezier(0.4,0,1,1) — starts after 60ms
- border-radius: 0.18s cubic-bezier(0.4,0,1,1)
- background + border: 0.14s ease after 60ms

**Filter drawer:**
- Slides up from bottom on filter icon tap
- Contains protein filter pills + show results button
- Backdrop: rgba(247,244,239,0.7) with blur(2px)


## Screen 1 — Recipe List

- 1-column card grid, full width
- RecipeCard: protein + time combined in one pill above title,
  rating moved to top-right glass badge, cuisine removed
- Category filter: horizontal pill row, accent colour when active
- Protein filter: appears below categories only when Dinner selected
- Search: olive FAB circle, Fix A animation (20px radius),
  white bar, olive border, filter funnel inside bar
- Bottom nav: Recipes / Menus / Shopping / Import (+ replaces Cooking)
  Import opens drawer via /recipes?import=true
- Filter drawer: cooking method, time presets, rating, 
  cuisine pills, dietary — no servings
- Empty state: page title + 3 action buttons (URL, paste, photo)

## Screen 2 — Recipe Detail — final decisions:

- Hero: Back (left) + Edit (right) top only. Bottom of hero: category badge (olive, left) + rating (glass, right), then title in Georgia below
- Description: Directly below hero, before any meta
- Method | Protein: One row, two columns, label left + value right, centered short divider
- Total time | Servings: One row, two columns, centered Georgia numerals, same divider style
- Tabs: Ingredients / Steps, pill switcher style
- Ingredients: Name left, scaled amount+unit right, divider lines between
- Steps: Olive numbered circles, instruction text, ingredient pills below each step
- Footer: Start cooking primary (olive), "Add to shopping list" small underlined text link

## Screen 4 — Menu Builder

### Menu List
- Active menu pinned above scroll area — sticky, never scrolls away
- Active menu card collapses as user scrolls: full card (images + 
  recipe list) → compact bar (name flex:1, protein badge right)
- Olive border signals active — no Active badge needed in collapsed state
- "This week" label above active card, fades as card collapses
- All other menus in scrollable list below "All menus" divider
- Protein filter pills: All / Kjøtt / Kylling / Fisk / Vegetar
  each in their own colour when active
- Infinite scroll — load more menus as user approaches bottom
- Menu card: 2x2 image grid, Georgia name, protein badge

### Anchor Picker
- First-use tooltip explaining the concept (dismissible with ×)
- 2-column card grid, protein badge per card in protein colour

### Review / Builder
- Menu name: click-to-edit, tapping opens inline input
- Shared ingredient count: shown as pill when ≥ 3 shared
- When < 3 shared: amber actionable text "Only X shared — regenerate?"
- Full ingredient dump removed — only shared ingredient pills per recipe
- Anchor badge: olive, not red
- Swap button: olive, not red
- Pantry staples excluded from shared ingredient calculation:
  salt, pepper, oil, butter, garlic, onion, water, sugar, flour,
  eggs, milk, cream, stock, tomato paste, soy sauce, vinegar,
  lemon juice, olive oil, baking powder, baking soda, cornstarch,
  honey, mustard
- Save button: olive

### Menu Detail
- Active menu CTA: "Add to shopping list" primary button
- Per-recipe protein badges in protein colours
- Clicking active card in list opens menu detail

## Screen 6 — Profile & Settings (planned, not yet built)

- Planned for when multi-user support is needed
- Requires Supabase RLS implementation before any public launch
- Will contain: account, light/dark mode toggle, default 
  servings, store section ordering, data export
- When added: bottom nav becomes Recipes / Menus / Shopping 
  / Profile — Import moves to a centralised position
- Do not build until RLS is implemented

