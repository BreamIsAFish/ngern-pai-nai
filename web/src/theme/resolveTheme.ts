export type Theme = 'light' | 'dark'

/** Resolves a saved choice, falling back to the device color scheme. */
export default function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light'
}
