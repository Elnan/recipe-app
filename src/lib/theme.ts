export type Theme = 'light' | 'dark'

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light'
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return null
  } catch { return null }
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem('theme', theme) } catch {}
}

export function clearTheme() {
  document.documentElement.removeAttribute('data-theme')
  try { localStorage.removeItem('theme') } catch {}
}

export function getCurrentTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}
