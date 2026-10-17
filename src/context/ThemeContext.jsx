import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const themes = [
  { id: 'olng',     label: 'OLNG Brand (Light)', primary: '#0089cf', accent: '#1b4c6f', sidebar: '#1b4c6f' },
  { id: 'tenderiq', label: 'Dark',               primary: '#2563EB', accent: '#F59E0B', sidebar: '#070C18' },
]

const DARK_THEMES = new Set(['tenderiq'])

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('atm_theme') || 'olng'
    } catch {
      return 'olng'
    }
  })

  const isDark = DARK_THEMES.has(theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    try {
      localStorage.setItem('atm_theme', theme)
    } catch {}
  }, [theme, isDark])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
