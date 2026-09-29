'use client'

import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/context'
import { useCMS } from '@/lib/cms'
import type { NavItem } from '@/lib/cms'

/** Shared surface for every flyout, so nested levels look like the first. */
const PANEL_SURFACE =
  'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden'
const PANEL_INNER =
  'relative bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/90 dark:to-slate-900/50'
const ROW_BASE =
  'group/item flex w-full items-center justify-between gap-3 px-5 py-3 mx-2 my-0.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 text-left'

/** An item is a branch only if it actually has children, whatever `type` says. */
function childrenOf(item: NavItem): NavItem[] {
  return item.children ?? []
}

/**
 * Renders one level of the menu, recursing for deeper ones.
 *
 * The previous version mapped `item.children` once, so anything nested below
 * that was silently dropped from the page while remaining editable in the admin.
 * Recursing is what makes the tree depth-agnostic: the admin can nest as deep as
 * it likes and the site follows.
 */
function NavMenuLevel({
  items,
  openIds,
  onToggle,
  onNavigate,
  parentItem,
  depth,
}: {
  items: NavItem[]
  openIds: string[]
  onToggle: (id: string, hover: boolean) => void
  onNavigate: () => void
  /** Rendered as a link at the top of the panel, so the branch is reachable. */
  parentItem?: NavItem
  depth: number
}) {
  return (
    <>
      {parentItem?.href && (
        <Link
          href={parentItem.href}
          target={parentItem.newTab ? '_blank' : undefined}
          rel={parentItem.newTab ? 'noopener noreferrer' : undefined}
          onClick={onNavigate}
          className={`${ROW_BASE} font-bold text-slate-900 dark:text-white`}
        >
          <span className="truncate">{parentItem.label}</span>
        </Link>
      )}

      {items.map(item => {
        const kids = childrenOf(item)

        if (kids.length === 0) {
          return (
            <Link
              key={item.id}
              href={item.href || '#'}
              target={item.newTab ? '_blank' : undefined}
              rel={item.newTab ? 'noopener noreferrer' : undefined}
              onClick={onNavigate}
              className={ROW_BASE}
            >
              <span className="font-medium text-slate-900 dark:text-white transition-colors group-hover/item:text-[var(--brand-600)] dark:group-hover/item:text-[var(--brand-300)]">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-300 group-hover/item:text-[var(--brand-600)] opacity-0 group-hover/item:opacity-100 transition-all" />
            </Link>
          )
        }

        const open = openIds.includes(item.id)
        return (
          <div key={item.id} className="relative group/item">
            <button
              type="button"
              onClick={() => onToggle(item.id, false)}
              onMouseEnter={() => onToggle(item.id, true)}
              aria-expanded={open}
              className={ROW_BASE}
            >
              <span className="font-medium text-slate-900 dark:text-white transition-colors group-hover/item:text-[var(--brand-600)] dark:group-hover/item:text-[var(--brand-300)]">
                {item.label}
              </span>
              <ChevronRight
                className={`w-4 h-4 shrink-0 text-slate-300 group-hover/item:text-[var(--brand-600)] transition-transform duration-200 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </button>

            {open && (
              // Opens to the side, so a deep branch stays on screen instead of
              // being clipped by the viewport.
              <div
                className="absolute left-full top-0 pl-2 z-10"
                style={{ animation: 'dropdownFadeIn 0.2s ease forwards' }}
              >
                <div className={`${PANEL_SURFACE} min-w-[15rem] max-w-[22rem]`}>
                  <div className={`${PANEL_INNER} rounded-2xl py-2`}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-500)] via-[var(--brand-300)] to-[var(--brand-500)]" />
                    <NavMenuLevel
                      items={kids}
                      openIds={openIds}
                      onToggle={onToggle}
                      onNavigate={onNavigate}
                      parentItem={item}
                      depth={depth + 1}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/** Walks a path of ids through the tree, returning the items at the end of it. */
export function itemsAtPath(items: NavItem[], path: string[]): NavItem[] {
  let level = items
  for (const id of path) {
    const found = level.find(i => i.id === id)
    if (!found) return []
    level = childrenOf(found)
  }
  return level
}

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
  const { lang, t, toggleLang, theme, toggleTheme } = useLanguage()
  const { navigation, contactInfo, supabaseReady } = useCMS()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Ids of the flyouts currently open, at any depth. A single id only ever
  // described one level, so opening a nested submenu closed its parent.
  const [dropdownOpen, setDropdownOpen] = useState<string[]>([])
  // The chain of ids drilled into on mobile, so each level can be reached.
  const [mobilePath, setMobilePath] = useState<string[]>([])
  // One ref per dropdown. A single shared ref was overwritten on every render,
  // so outside-click detection only ever worked for the last item in the list.
  const dropdownRefs = useRef(new Map<string, HTMLDivElement>())
  const [isReady, setIsReady] = useState(false)

  // The theme toggle waits for the CMS so it never renders before hydration.
  useEffect(() => {
    if (!supabaseReady) return
    const id = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(id)
  }, [supabaseReady])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const insideADropdown = Array.from(dropdownRefs.current.values()).some(
        element => element.contains(target)
      )
      if (!insideADropdown) {
        setDropdownOpen([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // The scroll lock is a global side effect, so it has to be undone if this
  // component unmounts while the menu is open (e.g. client-side nav to /admin).
  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen)
    setMobilePath([])
  }

  const closeMobile = () => {
    setMobileOpen(false)
    setMobilePath([])
  }

  /**
   * Opens a flyout without closing its ancestors, so a deep branch can be
   * explored level by level. A click toggles; hovering only ever adds.
   */
  const toggleFlyout = (id: string, hover: boolean) => {
    setDropdownOpen(prev => {
      if (hover) return prev.includes(id) ? prev : [...prev, id]
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    })
  }

  const closeAllFlyouts = () => setDropdownOpen([])

  const pushMobileLevel = (id: string) => setMobilePath(prev => [...prev, id])
  const popMobileLevel = () => setMobilePath(prev => prev.slice(0, -1))

  const getLabel = (item: NavItem) => item.label

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className={`text-xl sm:text-2xl font-bold z-50 transition-colors duration-300 ${scrolled || mobileOpen ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
              Stay<span className="text-[var(--brand-600)]">Main</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8" data-nav-desktop>
              {navigation.map((item) => {
                const kids = childrenOf(item)
                const open = dropdownOpen.includes(item.id)

                if (kids.length === 0) {
                  return (
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
                }

                return (
                  <div
                    key={item.id}
                    className="relative group"
                    ref={el => {
                      if (el) dropdownRefs.current.set(item.id, el)
                      else dropdownRefs.current.delete(item.id)
                    }}
                  >
                    <button
                      onClick={() => toggleFlyout(item.id, false)}
                      onMouseEnter={() => toggleFlyout(item.id, true)}
                      aria-expanded={open}
                      className={`nav-link text-sm font-medium flex items-center gap-1 transition-colors ${scrolled ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white' : 'text-white/80 hover:text-white'}`}
                    >
                      {getLabel(item)}
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {open && (
                      <div
                        className="absolute top-full left-1/2 w-64 -translate-x-1/2 pt-6"
                        style={{ animation: 'dropdownFadeIn 0.3s ease forwards' }}
                      >
                        <div className={PANEL_SURFACE}>
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-l border-t border-white/20 dark:border-slate-700/30 rotate-45" />
                          <div className={`${PANEL_INNER} rounded-2xl py-2`}>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-500)] via-[var(--brand-300)] to-[var(--brand-500)]" />
                            <NavMenuLevel
                              items={kids}
                              openIds={dropdownOpen}
                              onToggle={toggleFlyout}
                              onNavigate={closeAllFlyouts}
                              depth={1}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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
                className="px-5 xl:px-6 py-2.5 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white font-medium rounded-full transition-all hover:shadow-lg hover:shadow-[rgba(65,105,225,0.3)] text-sm"
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

      <div
        data-nav-mobile
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-2xl lg:hidden transition-all duration-500 ease-out ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col h-full pt-20 sm:pt-24" style={{ animation: mobileOpen ? 'mobileMenuIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none' }}>
          {/* min-h-0 lets the flex child shrink, and overflow-y-auto makes the
              list scrollable. It was overflow-hidden, so the lower links and the
              CTA were unreachable on short viewports. */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-6 relative">
            {/* One panel for whichever level of the tree the path points at, so
                the menu can be drilled through however deep the admin nests it.
                The old markup rendered a separate overlay per top-level item,
                which capped the mobile menu at one level of children. */}
            {(() => {
              const level = itemsAtPath(navigation, mobilePath)
              const parentItem =
                mobilePath.length > 0
                  ? itemsAtPath(navigation, mobilePath.slice(0, -1)).find(
                      i => i.id === mobilePath[mobilePath.length - 1]
                    )
                  : undefined

              return (
                <div className="space-y-2">
                  {mobilePath.length > 0 && (
                    <button
                      onClick={popMobileLevel}
                      className="flex items-center gap-3 py-4 text-[var(--brand-600)] font-medium"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Tilbage</span>
                    </button>
                  )}

                  {parentItem?.href && (
                    <Link
                      href={parentItem.href}
                      onClick={closeMobile}
                      className="block py-4 text-2xl font-bold text-white border-b border-slate-800"
                    >
                      {getLabel(parentItem)}
                    </Link>
                  )}

                  {level.map(item => {
                    const kids = childrenOf(item)
                    return (
                      <div key={item.id}>
                        {kids.length > 0 ? (
                          <button
                            onClick={() => pushMobileLevel(item.id)}
                            aria-label={`Åbn underpunkter for ${item.label}`}
                            className="w-full flex items-center justify-between py-4 text-lg font-medium text-white border-b border-slate-800 text-left"
                          >
                            <span className="truncate">{getLabel(item)}</span>
                            <svg className="w-6 h-6 shrink-0 text-[var(--brand-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            onClick={closeMobile}
                            className="flex items-center justify-between py-4 text-lg font-medium text-white border-b border-slate-800"
                          >
                            <span className="truncate">{getLabel(item)}</span>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </nav>
          
          <div className="p-6 border-t border-slate-800">
            <Link
              href="/kontakt"
              onClick={closeMobile}
              className="block w-full text-center px-6 py-4 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white font-semibold rounded-2xl transition-all text-lg"
            >
              {contactInfo.headerButtonText}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
