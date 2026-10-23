import useTheme from './useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return <button aria-label="Switch light or dark theme" aria-pressed={theme === 'dark'} className="theme-toggle" onClick={toggleTheme} type="button">
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></> : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
    </svg>
  </button>
}
