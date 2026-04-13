'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { translations, servicesList, type Language, type Translations } from './translations'

interface LanguageContextType {
  lang: Language
  t: Translations
  toggleLang: () => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  services: typeof servicesList
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [lang, setLang] = useState<Language>('da')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('staymain_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (pathname?.startsWith('/admin')) return
    
    const savedLang = localStorage.getItem('staymain-lang') as Language | null
    const shouldBeEnglish = pathname?.startsWith('/en')
    
    if (savedLang === 'en' && !shouldBeEnglish) {
      const pathWithoutSlash = pathname === '/' ? '' : pathname
      router.replace(`/en${pathWithoutSlash}`)
    } else if (savedLang === 'da' && shouldBeEnglish) {
      const pathWithoutEn = pathname?.replace(/^\/en/, '') || '/'
      router.replace(pathWithoutEn || '/')
    } else {
      setLang(shouldBeEnglish ? 'en' : 'da')
    }
  }, [pathname, mounted, router])

  const toggleLang = () => {
    const newLang = lang === 'da' ? 'en' : 'da'
    setLang(newLang)
    localStorage.setItem('staymain-lang', newLang)
    
    if (newLang === 'en') {
      const pathWithoutSlash = pathname === '/' ? '' : pathname
      router.push(`/en${pathWithoutSlash}`)
    } else {
      const pathWithoutEn = pathname?.replace(/^\/en/, '') || '/'
      router.push(pathWithoutEn || '/')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('staymain_theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      t: translations[lang], 
      toggleLang,
      theme,
      toggleTheme,
      services: servicesList
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
