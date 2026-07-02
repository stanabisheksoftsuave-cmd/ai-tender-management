import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const themes = [
  { id: 'olng',     label: 'OLNG Brand',        primary: '#0089cf', accent: '#1b4c6f', sidebar: '#1b4c6f' },
  { id: 'bright',   label: 'Bright',             primary: '#2563EB', accent: '#F59E0B', sidebar: '#FFFFFF' },
  { id: 'ocean',    label: 'Ocean Teal',         primary: '#1AA8A8', accent: '#F0C050', sidebar: '#082828' },
  { id: 'navy',     label: 'Navy Blue',          primary: '#1B4F8A', accent: '#D4AF37', sidebar: '#0A1828' },
  { id: 'sage',     label: 'Sage Green',         primary: '#5A7A48', accent: '#C8904A', sidebar: '#1E2E14' },
  { id: 'tenderiq', label: 'TenderIQ Dark',      primary: '#2563EB', accent: '#F59E0B', sidebar: '#070C18' },
  { id: 'midnight', label: 'Midnight Purple',    primary: '#7048C8', accent: '#C88040', sidebar: '#0A0818' },
]

const DARK_THEMES = new Set(['tenderiq', 'midnight'])

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('olng')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const isDark = DARK_THEMES.has(theme)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
