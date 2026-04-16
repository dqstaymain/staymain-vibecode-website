'use client'

import { useState, useEffect, useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { useCMS } from '@/lib/cms'

function HamburgerIcon({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 relative w-10 h-10 flex items-center justify-center"
    >
      <div className="relative w-6 h-5">
        <span 
          className={`absolute left-0 w-6 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${
            isOpen ? 'top-2 rotate-45' : 'top-0 rotate-0'
          }`}
          style={{ 
            color: 'currentColor',
            top: isOpen ? '50%' : '0',
            transform: isOpen ? 'translateY(-50%) rotate(45deg)' : 'translateY(0) rotate(0deg)'
          }}
        />
        <span 
          className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current rounded-full transition-all duration-200 ease-out -translate-y-1/2 ${
            isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
          }`}
          style={{ color: 'inherit' }}
        />
        <span 
          className={`absolute left-0 w-6 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${
            isOpen ? 'bottom-2 -rotate-45' : 'bottom-0 rotate-0'
          }`}
          style={{ 
            color: 'currentColor',
            bottom: isOpen ? '50%' : '0',
            transform: isOpen ? 'translateY(50%) rotate(-45deg)' : 'translateY(0) rotate(0deg)'
          }}
        />
      </div>
    </button>
  )
}

export default function Navigation() {
  const { theme, toggleTheme, mounted } = useTheme()
  const { navigation, contactInfo, supabaseReady } = useCMS()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (mounted && supabaseReady) {
      setTimeout(() => setIsReady(true), 100)
    }
  }, [mounted, supabaseReady])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen)
    if (!mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    setMobileDropdownOpen(null)
  }

  const closeMobile = () => {
    setMobileOpen(false)
    document.body.style.overflow = ''
    setMobileDropdownOpen(null)
  }

  const openDropdown = (id: string) => {
    setMobileDropdownOpen(id)
  }

  const closeDropdown = () => {
    setMobileDropdownOpen(null)
  }

  const getLabel = (item: any) => {
    return item.label
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className={`text-xl sm:text-2xl font-bold z-50 transition-colors duration-300 ${scrolled || mobileOpen ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
              Stay<span className="text-blue-500">Main</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => (
                item.children && item.children.length > 0 ? (
                  <div key={item.id} className="relative group" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === item.id ? null : item.id)}
                      onMouseEnter={() => setDropdownOpen(item.id)}
                      className={`nav-link text-sm font-medium flex items-center gap-1 transition-colors ${scrolled ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white' : 'text-white/80 hover:text-white'}`}
                    >
                      {getLabel(item)}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen === item.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {dropdownOpen === item.id && (
                      <div 
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-64"
                        style={{ 
                          animation: 'dropdownFadeIn 0.3s ease forwards',
                        }}
                      >
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-l border-t border-white/20 dark:border-slate-700/30 rotate-45" />
                          <div className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/90 dark:to-slate-900/50 rounded-2xl py-2">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.href || '#'}
                                target={child.newTab ? '_blank' : undefined}
                                rel={child.newTab ? 'noopener noreferrer' : undefined}
                                onClick={() => setDropdownOpen(null)}
                                className="group/item flex items-center justify-between px-5 py-3 mx-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200"
                              >
                                <span className="font-medium text-slate-900 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                                  {getLabel(child)}
                                </span>
                                <svg className="w-4 h-4 text-slate-300 group-hover/item:text-blue-500 opacity-0 group-hover/item:opacity-100 transform translate-x-0 group-hover/item:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link 
                    key={item.id}
                    href={item.href || '#'} 
                    target={item.newTab ? '_blank' : undefined}
                    rel={item.newTab ? 'noopener noreferrer' : undefined}
                    className={`nav-link text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white' : 'text-white/80 hover:text-white'}`}
                  >
                    {getLabel(item)}
                  </Link>
                )
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              {isReady && (
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors ${scrolled ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
              <Link
                href="/kontakt"
                className="px-5 xl:px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/30 text-sm"
              >
                {contactInfo.headerButtonText}
              </Link>
            </div>

            <div className="flex lg:hidden items-center gap-3 z-50">
              {isReady && (
                <>
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-colors ${scrolled || mobileOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-white/10 text-white'}`}
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <div className={`transition-colors duration-300 ${scrolled || mobileOpen ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
                    <HamburgerIcon isOpen={mobileOpen} onClick={toggleMobile} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-2xl lg:hidden transition-all duration-500 ease-out ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col h-full pt-20 sm:pt-24" style={{ animation: mobileOpen ? 'mobileMenuIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none' }}>
          <nav className="flex-1 px-6 overflow-hidden relative">
            <div 
              className={`absolute inset-0 px-6 transition-all duration-300 ease-out ${
                mobileDropdownOpen ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
              }`}
            >
              <div className="space-y-2">
                {navigation.map((item) => (
                  <div key={item.id}>
                    {item.type === 'dropdown' ? (
                      <button
                        onClick={() => openDropdown(item.id)}
                        className="w-full flex items-center justify-between py-4 text-lg font-medium text-white border-b border-slate-800"
                      >
                        <span>{getLabel(item)}</span>
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <Link 
                        href={item.href || '#'} 
                        onClick={closeMobile} 
                        className="flex items-center justify-between py-4 text-lg font-medium text-white border-b border-slate-800"
                      >
                        <span>{getLabel(item)}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {navigation.map((item) => (
              item.type === 'dropdown' && (
                <div 
                  key={`dropdown-${item.id}`}
                  className={`absolute inset-0 px-6 bg-slate-950/50 backdrop-blur-2xl transition-all duration-300 ease-out ${
                    mobileDropdownOpen === item.id ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                  }`}
                >
                  <div className="space-y-2">
                    <button
                      onClick={closeDropdown}
                      className="flex items-center gap-3 py-4 text-blue-500 font-medium"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Tilbage</span>
                    </button>
                    
                    <div className="pt-4 space-y-1">
                      <Link
                        href={item.href || '#'}
                        onClick={closeMobile}
                        className="block py-4 text-2xl font-bold text-white border-b border-slate-800"
                      >
                        {getLabel(item)}
                      </Link>
                      
                      {item.children?.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href || '#'}
                          onClick={closeMobile}
                          className="flex items-center justify-between py-4 text-lg text-slate-400 hover:text-blue-500 transition-colors border-b border-slate-800"
                        >
                          <span>{getLabel(child)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}
          </nav>
          
          <div className="p-6 border-t border-slate-800">
            <Link
              href="/kontakt"
              onClick={closeMobile}
              className="block w-full text-center px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all text-lg"
            >
              {contactInfo.headerButtonText}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
