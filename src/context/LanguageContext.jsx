import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en')

  const setLang = (l) => {
    setLangState(l)
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  const t = (key) =>
    translations[lang]?.[key] ?? translations['en']?.[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
