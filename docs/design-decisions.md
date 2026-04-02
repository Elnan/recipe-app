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