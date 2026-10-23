import { useSyncExternalStore } from 'react'
import resolveTheme, { type Theme } from './resolveTheme'

const storageKey = 'paper-butter-theme'
const eventName = 'paper-theme-change'
let preference: string | null = null

function savedTheme() {
  try { return localStorage.getItem(storageKey) } catch { return null }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  window.dispatchEvent(new Event(eventName))
}

/** Keeps system changes in sync until the user explicitly chooses a theme. */
export function initializeTheme() {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  preference = savedTheme()
  applyTheme(resolveTheme(preference, media.matches))
  media.addEventListener('change', () => applyTheme(resolveTheme(preference, media.matches)))
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      preference = savedTheme()
      applyTheme(resolveTheme(preference, media.matches))
    }
  })
}

function subscribe(onChange: () => void) {
  window.addEventListener(eventName, onChange)
  return () => window.removeEventListener(eventName, onChange)
}

/** Provides the current theme and a persistent light/dark toggle. */
export default function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  return { theme, toggleTheme: () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    preference = next
    try { localStorage.setItem(storageKey, next) } catch { /* Theme still works without storage. */ }
    applyTheme(next)
  } }
}
