'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/recipes',          label: 'Recipes',  icon: RecipesIcon },
  { href: '/menus',            label: 'Menus',    icon: MenusIcon },
  { href: '/shopping',         label: 'Shopping', icon: ShoppingIcon },
  { href: '/recipes?import=true', label: 'Import', icon: ImportIcon },
]

export default function BottomNav({ onImportClick }: { onImportClick?: () => void } = {}) {
  const pathname = usePathname()

  return (
    <nav
      data-app-bottom-nav
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          onImportClick ? 31 : 30,
        background:      'var(--color-surface)',
        borderTop:       '1px solid var(--color-border)',
        display:         'flex',
        paddingBottom:   'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isImport = href.includes('?')
        const active = isImport ? false : pathname.startsWith(href)

        if (isImport && onImportClick) {
          return (
            <button
              key={href}
              onClick={onImportClick}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            4,
                padding:        '10px 0 12px',
                background:     'none',
                border:         'none',
                cursor:         'pointer',
                color:          'var(--color-text-dim)',
                transition:     'color 150ms ease',
              }}
            >
              <Icon active={false} />
              <span
                style={{
                  fontSize:      10,
                  fontFamily:    'var(--font-geist-mono)',
                  letterSpacing: '0.05em',
                  lineHeight:    1,
                }}
              >
                {label}
              </span>
            </button>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            4,
              padding:        '10px 0 12px',
              textDecoration: 'none',
              color:          active ? 'var(--color-accent)' : 'var(--color-text-dim)',
              transition:     'color 150ms ease',
            }}
          >
            <Icon active={active} />
            <span
              style={{
                fontSize:      10,
                fontFamily:    'var(--font-geist-mono)',
                letterSpacing: '0.05em',
                lineHeight:    1,
              }}
            >
              {label}
            </span>
            {active && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-accent)',
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function RecipesIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--color-accent)' : 'var(--color-text-dim)'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" />
      <rect x="12" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" />
      <rect x="3" y="12" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" />
      <rect x="12" y="12" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function MenusIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--color-accent)' : 'var(--color-text-dim)'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4" width="16" height="14" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M7 8h8M7 11h8M7 14h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ShoppingIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--color-accent)' : 'var(--color-text-dim)'
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 5h14l-1.5 9H5.5L4 5z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8.5" cy="18" r="1" fill={c} />
      <circle cx="14.5" cy="18" r="1" fill={c} />
      <path d="M4 5l-.75-2H2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <span style={{ fontSize: 22, fontWeight: 300, lineHeight: 1, color: 'var(--color-text-dim)' }}>
      +
    </span>
  )
}
