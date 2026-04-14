'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, supabaseAdmin, saveCMSPages, loadCMSPages, saveCMSNavigation, loadCMSNavigation, saveCMSContactInfo, loadCMSContactInfo, saveCMSCases, loadCMSCases, saveCMSTestimonials, loadCMSTestimonials, saveCMSCompanyLogos, loadCMSCompanyLogos, deleteCMSPage, deleteCMSNavigation, deleteCMSCase, deleteCMSTestimonial, deleteCMSCompanyLogo } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface CMSBlock {
  id: string
  type: 'hero' | 'text' | 'services' | 'testimonials' | 'cta' | 'stats' | 'gallery' | 'contact'
  content?: Record<string, any>
}

export interface CMSPage {
  slug: string
  title: string
  parentSlug?: string
  blocks: CMSBlock[]
  meta?: {
    title?: string
    description?: string
  }
}

export interface NavItem {
  id: string
  label: string
  type: 'link' | 'dropdown'
  href?: string
  pageSlug?: string
  parentNavId?: string
  children?: NavItem[]
  newTab?: boolean
}

export interface CMSUser {
  id: string
  email: string
}

export interface ContactInfo {
  logo?: string
  favicon?: string
  companyName: string
  phone: string
  email: string
  address: string
  cvr: string
}

export interface Case {
  id: string
  title: string
  image: string
  link?: string
}

export interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  image: string
}

export interface CompanyLogo {
  id: string
  name: string
  image: string
  website?: string
}

interface CMSContextType {
  pages: CMSPage[]
  navigation: NavItem[]
  users: CMSUser[]
  cases: Case[]
  testimonials: Testimonial[]
  companyLogos: CompanyLogo[]
  contactInfo: ContactInfo
  isAuthenticated: boolean
  currentUser: User | null
  supabaseReady: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  createPage: (title: string, slug?: string, parentSlug?: string) => CMSPage | null
  updatePageDetails: (oldSlug: string, title: string, newSlug: string, parentSlug?: string) => boolean
  deletePage: (slug: string) => void
  updatePage: (slug: string, blocks: CMSBlock[]) => void
  updatePageMeta: (slug: string, meta: { title?: string; description?: string }) => void
  addBlock: (pageSlug: string, block: CMSBlock, index?: number) => void
  removeBlock: (pageSlug: string, blockId: string) => void
  moveBlock: (pageSlug: string, fromIndex: number, toIndex: number) => void
  updateBlockContent: (pageSlug: string, blockId: string, content: Record<string, any>) => void
  updateNavigation: (nav: NavItem[]) => void
  addNavItem: (item: NavItem, parentNavId?: string) => void
  removeNavItem: (itemId: string) => void
  removeNavItemFromParent: (itemId: string) => void
  moveNavItem: (fromIndex: number, toIndex: number) => void
  moveNavItemToParent: (childId: string, newParentId?: string) => void
  convertToDropdown: (parentId: string, childId: string) => void
  moveChildItem: (parentId: string, fromIndex: number, toIndex: number) => void
  updateNavItem: (itemId: string, updates: Partial<NavItem>) => void
  updateContactInfo: (info: Partial<ContactInfo>) => void
  addCase: (caseItem: Case) => void
  updateCase: (id: string, updates: Partial<Case>) => void
  deleteCase: (id: string) => void
  addTestimonial: (testimonial: Testimonial) => void
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => void
  deleteTestimonial: (id: string) => void
  addCompanyLogo: (logo: CompanyLogo) => void
  updateCompanyLogo: (id: string, updates: Partial<CompanyLogo>) => void
  deleteCompanyLogo: (id: string) => void
  addUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  updateUser: (userId: string, email: string) => Promise<{ success: boolean; error?: string }>
  updateUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
  fetchUsers: () => Promise<void>
  generatePassword: () => string
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
}

const defaultPages: CMSPage[] = [
  {
    slug: 'home',
    title: 'Forside',
    meta: { title: 'StayMain | Web Design Agency', description: 'Vi skaber digitale oplevelser, der tæller.' },
    blocks: [
      { id: 'hero-1', type: 'hero', content: { title: 'Vi skaber digitale oplevelser, der tæller.' } },
      { id: 'services-1', type: 'services' },
      { id: 'testimonials-1', type: 'testimonials' },
      { id: 'cta-1', type: 'cta', content: { title: 'Klar til at komme i gang?', buttonText: 'Kontakt os' } },
    ]
  },
  {
    slug: 'ydelser',
    title: 'Ydelser',
    meta: { title: 'Ydelser | StayMain', description: 'Vi tilbyder alt inden for digital markedsføring og webudvikling.' },
    blocks: [
      { id: 'text-1', type: 'text', content: { title: 'Vores ydelser', body: 'Vi tilbyder alt inden for digital markedsføring og webudvikling.' } },
      { id: 'services-1', type: 'services' },
    ]
  },
  {
    slug: 'cases',
    title: 'Cases',
    meta: { title: 'Cases | StayMain', description: 'Se vores portefølje af succesfulde projekter.' },
    blocks: [
      { id: 'text-1', type: 'text', content: { title: 'Vores cases' } },
      { id: 'gallery-1', type: 'gallery' },
    ]
  },
  {
    slug: 'om-os',
    title: 'Om os',
    meta: { title: 'Om os | StayMain', description: 'Lær StayMain at kende - et kreativt webbureau i Danmark.' },
    blocks: [
      { id: 'text-1', type: 'text', content: { title: 'Om StayMain' } },
      { id: 'stats-1', type: 'stats' },
    ]
  },
  {
    slug: 'ofte-stillede-spørgsmål',
    title: 'FAQ',
    meta: { title: 'FAQ | StayMain', description: 'Ofte stillede spørgsmål om vores ydelser.' },
    blocks: [
      { id: 'text-1', type: 'text', content: { title: 'Ofte stillede spørgsmål' } },
    ]
  },
]

const defaultNavigation: NavItem[] = []

const defaultContactInfo: ContactInfo = {
  logo: '',
  favicon: '',
  companyName: 'StayMain',
  phone: '+45 12 34 56 78',
  email: 'kontakt@staymain.dk',
  address: 'Hovedgaden 1, 1234 København',
  cvr: '12345678'
}

const defaultCases: Case[] = []

const defaultTestimonials: Testimonial[] = []

const defaultCompanyLogos: CompanyLogo[] = []

const CMSContext = createContext<CMSContextType | undefined>(undefined)

function getInitialPages(): CMSPage[] {
  if (typeof window === 'undefined') return defaultPages
  try {
    const saved = localStorage.getItem('cms_pages')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {}
  return defaultPages
}

function getInitialNavigation(): NavItem[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('cms_navigation')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return migrateNavigation(parsed)
      }
    }
  } catch {}
  return []
}

function migrateNavigation(nav: NavItem[]): NavItem[] {
  return nav.map(item => {
    const fixedItem = {
      ...item,
      href: item.href && !item.href.startsWith('/') ? `/${item.href}` : item.href,
      children: item.children ? migrateNavigation(item.children) : undefined
    }
    return fixedItem
  })
}

function fixNavigationHrefs(nav: NavItem[]): NavItem[] {
  return nav.map(item => {
    if (!item.href?.startsWith('/')) {
      item.href = `/${item.href}`
    }
    if (item.children) {
      item.children = fixNavigationHrefs(item.children)
    }
    return item
  })
}

function getInitialContactInfo(): ContactInfo {
  if (typeof window === 'undefined') return defaultContactInfo
  try {
    const saved = localStorage.getItem('cms_contact_info')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return defaultContactInfo
}

function getInitialCases(): Case[] {
  if (typeof window === 'undefined') return defaultCases
  try {
    const saved = localStorage.getItem('cms_cases')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return defaultCases
}

function getInitialTestimonials(): Testimonial[] {
  if (typeof window === 'undefined') return defaultTestimonials
  try {
    const saved = localStorage.getItem('cms_testimonials')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return defaultTestimonials
}

function getInitialCompanyLogos(): CompanyLogo[] {
  if (typeof window === 'undefined') return defaultCompanyLogos
  try {
    const saved = localStorage.getItem('cms_company_logos')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return defaultCompanyLogos
}

export function CMSProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [navigation, setNavigation] = useState<NavItem[]>([])
  const [users, setUsers] = useState<CMSUser[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [companyLogos, setCompanyLogos] = useState<CompanyLogo[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseReady, setSupabaseReady] = useState(false)
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState(false)

  useEffect(() => {
    const initSupabase = async () => {
      const [cloudPages, cloudNav, cloudContact, cloudCases, cloudTestimonials, cloudLogos] = await Promise.all([
        loadCMSPages(),
        loadCMSNavigation(),
        loadCMSContactInfo(),
        loadCMSCases(),
        loadCMSTestimonials(),
        loadCMSCompanyLogos()
      ])
      
      if (cloudPages !== null) {
        const finalPages = cloudPages.length > 0 ? cloudPages : defaultPages
        setPages(finalPages)
        localStorage.setItem('cms_pages', JSON.stringify(finalPages))
      } else {
        setPages(getInitialPages())
      }
      
      if (cloudNav !== null) {
        const finalNav = cloudNav.length > 0 ? cloudNav : []
        setNavigation(finalNav)
        localStorage.setItem('cms_navigation', JSON.stringify(finalNav))
      } else {
        setNavigation(getInitialNavigation())
      }
      
      if (cloudContact !== null) {
        setContactInfo(cloudContact)
        localStorage.setItem('cms_contact_info', JSON.stringify(cloudContact))
      } else {
        setContactInfo(getInitialContactInfo())
      }
      
      if (cloudCases !== null) {
        const finalCases = cloudCases.length > 0 ? cloudCases : []
        setCases(finalCases)
        localStorage.setItem('cms_cases', JSON.stringify(finalCases))
      } else {
        setCases(getInitialCases())
      }
      
      if (cloudTestimonials !== null) {
        const finalTestimonials = cloudTestimonials.length > 0 ? cloudTestimonials : []
        setTestimonials(finalTestimonials)
        localStorage.setItem('cms_testimonials', JSON.stringify(finalTestimonials))
      } else {
        setTestimonials(getInitialTestimonials())
      }
      
      if (cloudLogos !== null) {
        const finalLogos = cloudLogos.length > 0 ? cloudLogos : []
        setCompanyLogos(finalLogos)
        localStorage.setItem('cms_company_logos', JSON.stringify(finalLogos))
      } else {
        setCompanyLogos(getInitialCompanyLogos())
      }
      
      setHasLoadedFromCloud(true)
      setSupabaseReady(true)
      setIsLoading(false)
    }

    initSupabase()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (hasLoadedFromCloud && pages.length > 0) {
      localStorage.setItem('cms_pages', JSON.stringify(pages))
      saveCMSPages(pages)
    }
  }, [pages, hasLoadedFromCloud])

  useEffect(() => {
    if (supabaseReady && navigation.length >= 0) {
      localStorage.setItem('cms_navigation', JSON.stringify(navigation))
      saveCMSNavigation(navigation)
    }
  }, [navigation, supabaseReady])

  useEffect(() => {
    if (hasLoadedFromCloud && cases.length > 0) {
      localStorage.setItem('cms_cases', JSON.stringify(cases))
      saveCMSCases(cases)
    }
  }, [cases, hasLoadedFromCloud])

  useEffect(() => {
    if (hasLoadedFromCloud && testimonials.length > 0) {
      localStorage.setItem('cms_testimonials', JSON.stringify(testimonials))
      saveCMSTestimonials(testimonials)
    }
  }, [testimonials, hasLoadedFromCloud])

  useEffect(() => {
    if (hasLoadedFromCloud && companyLogos.length > 0) {
      localStorage.setItem('cms_company_logos', JSON.stringify(companyLogos))
      saveCMSCompanyLogos(companyLogos)
    }
  }, [companyLogos, hasLoadedFromCloud])

  useEffect(() => {
    if (hasLoadedFromCloud && contactInfo.companyName) {
      localStorage.setItem('cms_contact_info', JSON.stringify(contactInfo))
      saveCMSContactInfo(contactInfo)
    }
  }, [contactInfo, hasLoadedFromCloud])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    setCurrentUser(data.user)
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const createPage = (title: string, slug?: string, parentSlug?: string): CMSPage | null => {
    const baseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const pageSlug = parentSlug ? `${parentSlug}/${baseSlug}` : baseSlug
    
    if (pages.some(p => p.slug === pageSlug)) {
      return null
    }
    
    const newPage: CMSPage = {
      slug: pageSlug,
      title,
      parentSlug,
      meta: { title: `${title} | StayMain`, description: '' },
      blocks: [
        { id: `text-${Date.now()}`, type: 'text', content: { title, body: '' } }
      ]
    }
    
    setPages(prev => {
      const newPages = [...prev, newPage]
      saveCMSPages(newPages)
      return newPages
    })
    return newPage
  }

  const deletePage = (slug: string) => {
    if (slug === 'home') return
    setPages(prev => {
      const newPages = prev.filter(p => p.slug !== slug && p.parentSlug !== slug)
      deleteCMSPage(slug)
      saveCMSPages(newPages)
      return newPages
    })
  }

  const updatePageDetails = (oldSlug: string, title: string, newSlug: string, parentSlug?: string): boolean => {
    const fullNewSlug = parentSlug ? `${parentSlug}/${newSlug}` : newSlug
    
    if (pages.some(p => p.slug === fullNewSlug && p.slug !== oldSlug)) {
      return false
    }
    
    setPages(prev => {
      const newPages = prev.map(p => {
        if (p.slug === oldSlug) {
          return { ...p, title, slug: fullNewSlug, parentSlug }
        }
        if (p.parentSlug === oldSlug) {
          return { ...p, parentSlug: fullNewSlug }
        }
        return p
      })
      saveCMSPages(newPages)
      return newPages
    })
    
    setNavigation(prev => {
      const newNav = prev.map(item => {
        if (item.pageSlug === oldSlug) {
          return { ...item, href: `/${fullNewSlug}`, pageSlug: fullNewSlug }
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.pageSlug === oldSlug) {
                return { ...child, href: `/${fullNewSlug}`, pageSlug: fullNewSlug }
              }
              return child
            })
          }
        }
        return item
      })
      saveCMSNavigation(newNav)
      return newNav
    })
    
    return true
  }

  const updatePage = (slug: string, blocks: CMSBlock[]) => {
    setPages(prev => {
      const newPages = prev.map(p => p.slug === slug ? { ...p, blocks } : p)
      saveCMSPages(newPages)
      return newPages
    })
  }

  const updatePageMeta = (slug: string, meta: { title?: string; description?: string }) => {
    setPages(prev => {
      const newPages = prev.map(p => 
        p.slug === slug ? { ...p, meta: { ...p.meta, ...meta } } : p
      )
      saveCMSPages(newPages)
      return newPages
    })
  }

  const addBlock = (pageSlug: string, block: CMSBlock, index?: number) => {
    setPages(prev => {
      const newPages = prev.map(p => {
        if (p.slug === pageSlug) {
          const newBlocks = [...p.blocks]
          if (index !== undefined) {
            newBlocks.splice(index, 0, block)
          } else {
            newBlocks.push(block)
          }
          return { ...p, blocks: newBlocks }
        }
        return p
      })
      saveCMSPages(newPages)
      return newPages
    })
  }

  const removeBlock = (pageSlug: string, blockId: string) => {
    setPages(prev => {
      const newPages = prev.map(p => {
        if (p.slug === pageSlug) {
          return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) }
        }
        return p
      })
      saveCMSPages(newPages)
      return newPages
    })
  }

  const moveBlock = (pageSlug: string, fromIndex: number, toIndex: number) => {
    setPages(prev => {
      const newPages = prev.map(p => {
        if (p.slug === pageSlug) {
          const newBlocks = [...p.blocks]
          const [removed] = newBlocks.splice(fromIndex, 1)
          newBlocks.splice(toIndex, 0, removed)
          return { ...p, blocks: newBlocks }
        }
        return p
      })
      saveCMSPages(newPages)
      return newPages
    })
  }

  const updateBlockContent = (pageSlug: string, blockId: string, content: Record<string, any>) => {
    setPages(prev => {
      const newPages = prev.map(p => {
        if (p.slug === pageSlug) {
          return {
            ...p,
            blocks: p.blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)
          }
        }
        return p
      })
      saveCMSPages(newPages)
      return newPages
    })
  }

  const updateNavigation = (nav: NavItem[]) => {
    saveCMSNavigation(nav)
    setNavigation(nav)
  }

  const addNavItem = (item: NavItem) => {
    const normalizedItem = {
      ...item,
      href: item.href?.startsWith('/') ? item.href : `/${item.href || ''}`
    }
    
    setNavigation(prev => {
      const newNav = [...prev, normalizedItem]
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const removeNavItem = (itemId: string) => {
    setNavigation(prev => {
      const newNav = prev.filter(item => item.id !== itemId)
      deleteCMSNavigation(itemId)
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const moveNavItem = (fromIndex: number, toIndex: number) => {
    setNavigation(prev => {
      const newNav = [...prev]
      const [removed] = newNav.splice(fromIndex, 1)
      newNav.splice(toIndex, 0, removed)
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const updateNavItem = (itemId: string, updates: Partial<NavItem>) => {
    const normalizedUpdates = {
      ...updates,
      href: updates.href?.startsWith('/') ? updates.href : updates.href ? `/${updates.href}` : updates.href
    }
    
    setNavigation(prev => {
      const topLevelIndex = prev.findIndex(i => i.id === itemId)
      if (topLevelIndex !== -1) {
        const newNav = prev.map(item => item.id === itemId ? { ...item, ...normalizedUpdates } : item)
        saveCMSNavigation(newNav)
        return newNav
      }
      
      const newNav = prev.map(item => {
        if (item.children?.some(c => c.id === itemId)) {
          return {
            ...item,
            children: item.children.map(c => c.id === itemId ? { ...c, ...normalizedUpdates } : c)
          }
        }
        if (item.children) {
          const nestedParent = item.children.find(c => c.children?.some((gc: NavItem) => gc.id === itemId))
          if (nestedParent && nestedParent.children) {
            return {
              ...item,
              children: item.children.map(c => {
                if (c.id === nestedParent.id) {
                  return {
                    ...c,
                    children: c.children?.map(gc => gc.id === itemId ? { ...gc, ...normalizedUpdates } : gc)
                  }
                }
                return c
              })
            }
          }
        }
        return item
      })
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const removeNavItemFromParent = (itemId: string) => {
    setNavigation(prev => {
      const newNav = prev.map(item => {
        if (item.children?.some(c => c.id === itemId)) {
          return {
            ...item,
            children: item.children?.filter(c => c.id !== itemId),
            type: (item.children?.length || 0) <= 1 ? 'link' as const : item.type
          }
        }
        return item
      })
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const moveNavItemToParent = (childId: string, newParentId?: string) => {
    setNavigation(prev => {
      let child: NavItem | undefined
      let foundInTopLevel = false
      
      const topLevelIndex = prev.findIndex(i => i.id === childId)
      if (topLevelIndex !== -1) {
        child = prev[topLevelIndex]
        foundInTopLevel = true
      }
      
      const withoutChild = prev.map(item => {
        if (item.children?.some(c => c.id === childId)) {
          if (!child) {
            child = item.children?.find(c => c.id === childId)
          }
          const newChildren = item.children?.filter(c => c.id !== childId) || []
          return {
            ...item,
            children: newChildren.length > 0 ? newChildren : undefined,
            type: newChildren.length > 0 ? item.type : 'link' as const
          }
        }
        if (item.children) {
          const nestedParent = item.children.find(c => c.children?.some((gc: NavItem) => gc.id === childId))
          if (nestedParent && nestedParent.children) {
            if (!child) {
              child = nestedParent.children.find((gc: NavItem) => gc.id === childId)
            }
            const newNestedChildren = nestedParent.children.filter((gc: NavItem) => gc.id !== childId)
            return {
              ...item,
              children: item.children.map(c => {
                if (c.id === nestedParent.id) {
                  return {
                    ...c,
                    children: newNestedChildren.length > 0 ? newNestedChildren : undefined,
                    type: newNestedChildren.length > 0 ? c.type : 'link' as const
                  }
                }
                return c
              })
            }
          }
        }
        return item
      })

      if (!child) return prev

      const normalizedChild = {
        ...child,
        href: child.href?.startsWith('/') ? child.href : `/${child.href || ''}`
      }

      let newNav: NavItem[]
      if (foundInTopLevel) {
        newNav = withoutChild.filter(i => i.id !== childId)
      } else {
        newNav = withoutChild
      }
      
      if (newParentId) {
        newNav = newNav.map(item => {
          if (item.id === newParentId) {
            return {
              ...item,
              type: 'dropdown' as const,
              children: [
                ...(item.children || []),
                { ...normalizedChild, parentNavId: newParentId }
              ]
            }
          }
          if (item.children?.some(c => c.id === newParentId)) {
            return {
              ...item,
              children: item.children.map(c => {
                if (c.id === newParentId) {
                  return {
                    ...c,
                    type: 'dropdown' as const,
                    children: [
                      ...(c.children || []),
                      { ...normalizedChild, parentNavId: newParentId }
                    ]
                  }
                }
                return c
              })
            }
          }
          return item
        })
      } else {
        newNav = [...newNav, { ...child, parentNavId: undefined }]
      }
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const moveChildItem = (parentId: string, fromIndex: number, toIndex: number) => {
    setNavigation(prev => {
      const newNav = prev.map(item => {
        if (item.id === parentId && item.children) {
          const newChildren = [...item.children]
          const [removed] = newChildren.splice(fromIndex, 1)
          newChildren.splice(toIndex, 0, removed)
          return { ...item, children: newChildren }
        }
        return item
      })
      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const convertToDropdown = (parentId: string, childId: string) => {
    setNavigation(prev => {
      const child = prev.find(i => i.id === childId)
      if (!child) return prev

      const withoutChild = prev.filter(i => i.id !== childId)

      const newNav = withoutChild.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            type: 'dropdown' as const,
            children: [
              ...(item.children || []),
              { ...child, parentNavId: parentId }
            ]
          }
        }
        if (item.children?.some(c => c.id === parentId)) {
          return {
            ...item,
            children: item.children.map(c => {
              if (c.id === parentId) {
                return {
                  ...c,
                  type: 'dropdown' as const,
                  children: [
                    ...(c.children || []),
                    { ...child, parentNavId: parentId }
                  ]
                }
              }
              return c
            })
          }
        }
        return item
      })

      saveCMSNavigation(newNav)
      return newNav
    })
  }

  const updateContactInfo = (info: Partial<ContactInfo>) => {
    setContactInfo(prev => {
      const newInfo = { ...prev, ...info }
      saveCMSContactInfo(newInfo)
      return newInfo
    })
  }

  const addCase = (caseItem: Case) => {
    setCases(prev => {
      const newCases = [...prev, caseItem]
      saveCMSCases(newCases)
      return newCases
    })
  }

  const updateCase = (id: string, updates: Partial<Case>) => {
    setCases(prev => {
      const newCases = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      saveCMSCases(newCases)
      return newCases
    })
  }

  const deleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id))
    deleteCMSCase(id)
  }

  const addTestimonial = (testimonial: Testimonial) => {
    setTestimonials(prev => {
      const newTestimonials = [...prev, testimonial]
      saveCMSTestimonials(newTestimonials)
      return newTestimonials
    })
  }

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials(prev => {
      const newTestimonials = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      saveCMSTestimonials(newTestimonials)
      return newTestimonials
    })
  }

  const deleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id))
    deleteCMSTestimonial(id)
  }

  const addCompanyLogo = (logo: CompanyLogo) => {
    setCompanyLogos(prev => {
      const newLogos = [...prev, logo]
      saveCMSCompanyLogos(newLogos)
      return newLogos
    })
  }

  const updateCompanyLogo = (id: string, updates: Partial<CompanyLogo>) => {
    setCompanyLogos(prev => {
      const newLogos = prev.map(l => l.id === id ? { ...l, ...updates } : l)
      saveCMSCompanyLogos(newLogos)
      return newLogos
    })
  }

  const deleteCompanyLogo = (id: string) => {
    setCompanyLogos(prev => prev.filter(l => l.id !== id))
    deleteCMSCompanyLogo(id)
  }

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const addUser = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseReady) {
      return { success: false, error: 'Supabase ikke konfigureret' }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, action: 'create' })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Fejl ved oprettelse' }
      }

      if (data.user?.id) {
        setUsers(prev => [...prev, { id: data.user.id, email }])
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Der opstod en fejl' }
    }
  }

  const updateUser = async (userId: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseReady) {
      return { success: false, error: 'Supabase ikke konfigureret' }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', userId, newEmail: email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Fejl ved opdatering' }
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email } : u))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Der opstod en fejl' }
    }
  }

  const updateUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseReady) {
      return { success: false, error: 'Supabase ikke konfigureret' }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePassword', userId, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Fejl ved opdatering' }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Der opstod en fejl' }
    }
  }

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseReady) {
      return { success: false, error: 'Supabase ikke konfigureret' }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Fejl ved sletning' }
      }

      setUsers(prev => prev.filter(u => u.id !== userId))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Der opstod en fejl' }
    }
  }

  const fetchUsers = async (): Promise<void> => {
    if (!supabaseReady) return

    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.users) {
        setUsers(data.users.map((u: any) => ({ id: u.id, email: u.email })))
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseReady) {
      return { success: false, error: 'Supabase ikke konfigureret' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  return (
    <CMSContext.Provider value={{
      pages,
      navigation,
      users,
      cases,
      testimonials,
      companyLogos,
      contactInfo,
      isAuthenticated: !!currentUser,
      currentUser,
      supabaseReady,
      login,
      logout,
      createPage,
      updatePageDetails,
      deletePage,
      updatePage,
      updatePageMeta,
      addBlock,
      removeBlock,
      moveBlock,
      updateBlockContent,
      updateNavigation,
      addNavItem,
      removeNavItem,
      removeNavItemFromParent,
      moveNavItem,
      moveNavItemToParent,
      moveChildItem,
      convertToDropdown,
      updateNavItem,
      updateContactInfo,
      addCase,
      updateCase,
      deleteCase,
      addTestimonial,
      updateTestimonial,
      deleteTestimonial,
      addCompanyLogo,
      updateCompanyLogo,
      deleteCompanyLogo,
      addUser,
      updateUser,
      updateUserPassword,
      deleteUser,
      fetchUsers,
      generatePassword,
      requestPasswordReset,
    }}>
      {children}
    </CMSContext.Provider>
  )
}

export function useCMS() {
  const context = useContext(CMSContext)
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider')
  }
  return context
}
