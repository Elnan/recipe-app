'use client'

import { useEffect, useState } from 'react'
import { getCurrentTheme, setTheme, type Theme } from '../../lib/theme'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setThemeState(getCurrentTheme())
    setMounted(true)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem('theme')) {
          setThemeState(e.matches ? 'dark' : 'light')
        }
      } catch {}
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background:    'transparent',
        border:        '1px solid var(--color-border)',
        borderRadius:  8,
        padding:       '6px 10px',
        cursor:        'pointer',
        fontFamily:    'var(--font-geist-mono)',
        fontSize:      11,
        color:         'var(--color-text-dim)',
        letterSpacing: '0.05em',
      }}
    >
      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
    </button>
  )
}
