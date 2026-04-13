'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
  labelEn: string
  type: 'link' | 'dropdown'
  href?: string
  pageSlug?: string
  parentNavId?: string
  children?: NavItem[]
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
  titleEn: string
  description: string
  descriptionEn: string
  image: string
  link?: string
  tags: string[]
}

export interface Testimonial {
  id: string
  name: string
  role: string
  roleEn: string
  content: string
  contentEn: string
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

const defaultNavigation: NavItem[] = [
  {
    id: 'nav-ydelser',
    label: 'Ydelser',
    labelEn: 'Services',
    type: 'link',
    href: '/ydelser',
    pageSlug: 'ydelser'
  },
  {
    id: 'nav-cases',
    label: 'Cases',
    labelEn: 'Cases',
    type: 'link',
    href: '/cases',
    pageSlug: 'cases'
  },
  {
    id: 'nav-om-os',
    label: 'Om os',
    labelEn: 'About',
    type: 'link',
    href: '/om-os',
    pageSlug: 'om-os'
  },
  {
    id: 'nav-faq',
    label: 'FAQ',
    labelEn: 'FAQ',
    type: 'link',
    href: '/ofte-stillede-spørgsmål',
    pageSlug: 'ofte-stillede-spørgsmål'
  },
]

const defaultContactInfo: ContactInfo = {
  logo: '',
  favicon: '',
  companyName: 'StayMain',
  phone: '+45 12 34 56 78',
  email: 'kontakt@staymain.dk',
  address: 'Hovedgaden 1, 1234 København',
  cvr: '12345678'
}

const defaultCases: Case[] = [
  {
    id: 'case-1',
    title: '案例 1',
    titleEn: 'Case 1',
    description: '案例描述',
    descriptionEn: 'Case description',
    image: '',
    tags: ['Web', 'Design']
  }
]

const defaultTestimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: '约翰·史密斯',
    role: 'CEO',
    roleEn: 'CEO',
    content: '优秀的工作！',
    contentEn: 'Excellent work!',
    image: ''
  }
]

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
  if (typeof window === 'undefined') return defaultNavigation
  try {
    const saved = localStorage.getItem('cms_navigation')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return migrateNavigation(parsed)
      }
    }
  } catch {}
  return defaultNavigation
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
  const [pages, setPages] = useState<CMSPage[]>(getInitialPages)
  const [navigation, setNavigation] = useState<NavItem[]>(getInitialNavigation)
  const [users, setUsers] = useState<CMSUser[]>([])
  const [cases, setCases] = useState<Case[]>(getInitialCases)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(getInitialTestimonials)
  const [companyLogos, setCompanyLogos] = useState<CompanyLogo[]>(getInitialCompanyLogos)
  const [contactInfo, setContactInfo] = useState<ContactInfo>(getInitialContactInfo)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseReady, setSupabaseReady] = useState(false)

  useEffect(() => {
    const initSupabase = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user ?? null)
      setSupabaseReady(!!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      setIsLoading(false)
    }

    initSupabase()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem('cms_pages', JSON.stringify(pages))
  }, [pages])

  useEffect(() => {
    localStorage.setItem('cms_navigation', JSON.stringify(navigation))
  }, [navigation])

  useEffect(() => {
    localStorage.setItem('cms_cases', JSON.stringify(cases))
  }, [cases])

  useEffect(() => {
    localStorage.setItem('cms_testimonials', JSON.stringify(testimonials))
  }, [testimonials])

  useEffect(() => {
    localStorage.setItem('cms_company_logos', JSON.stringify(companyLogos))
  }, [companyLogos])

  useEffect(() => {
    localStorage.setItem('cms_contact_info', JSON.stringify(contactInfo))
  }, [contactInfo])

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
    
    setPages(prev => [...prev, newPage])
    return newPage
  }

  const deletePage = (slug: string) => {
    if (slug === 'home') return
    setPages(prev => {
      return prev.filter(p => p.slug !== slug && p.parentSlug !== slug)
    })
    setNavigation(prev => prev.filter(item => item.pageSlug !== slug && !item.href?.startsWith(slug)))
  }

  const updatePageDetails = (oldSlug: string, title: string, newSlug: string, parentSlug?: string): boolean => {
    const fullNewSlug = parentSlug ? `${parentSlug}/${newSlug}` : newSlug
    
    if (pages.some(p => p.slug === fullNewSlug && p.slug !== oldSlug)) {
      return false
    }
    
    setPages(prev => prev.map(p => {
      if (p.slug === oldSlug) {
        return { ...p, title, slug: fullNewSlug, parentSlug }
      }
      if (p.parentSlug === oldSlug) {
        return { ...p, parentSlug: fullNewSlug }
      }
      return p
    }))
    
    setNavigation(prev => prev.map(item => {
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
    }))
    
    return true
  }

  const updatePage = (slug: string, blocks: CMSBlock[]) => {
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, blocks } : p))
  }

  const updatePageMeta = (slug: string, meta: { title?: string; description?: string }) => {
    setPages(prev => prev.map(p => 
      p.slug === slug ? { ...p, meta: { ...p.meta, ...meta } } : p
    ))
  }

  const addBlock = (pageSlug: string, block: CMSBlock, index?: number) => {
    setPages(prev => prev.map(p => {
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
    }))
  }

  const removeBlock = (pageSlug: string, blockId: string) => {
    setPages(prev => prev.map(p => {
      if (p.slug === pageSlug) {
        return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) }
      }
      return p
    }))
  }

  const moveBlock = (pageSlug: string, fromIndex: number, toIndex: number) => {
    setPages(prev => prev.map(p => {
      if (p.slug === pageSlug) {
        const newBlocks = [...p.blocks]
        const [removed] = newBlocks.splice(fromIndex, 1)
        newBlocks.splice(toIndex, 0, removed)
        return { ...p, blocks: newBlocks }
      }
      return p
    }))
  }

  const updateBlockContent = (pageSlug: string, blockId: string, content: Record<string, any>) => {
    setPages(prev => prev.map(p => {
      if (p.slug === pageSlug) {
        return {
          ...p,
          blocks: p.blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)
        }
      }
      return p
    }))
  }

  const updateNavigation = (nav: NavItem[]) => {
    setNavigation(nav)
  }

  const addNavItem = (item: NavItem, parentNavId?: string) => {
    const normalizedItem = {
      ...item,
      href: item.href?.startsWith('/') ? item.href : `/${item.href || ''}`
    }
    
    setNavigation(prev => {
      if (parentNavId) {
        const parentIndex = prev.findIndex(i => i.id === parentNavId)
        if (parentIndex !== -1) {
          const parent = prev[parentIndex]
          const updatedParent: NavItem = {
            ...parent,
            type: 'dropdown',
            children: [
              ...(parent.children || []),
              { ...normalizedItem, parentNavId }
            ]
          }
          return prev.map((navItem, index) => index === parentIndex ? updatedParent : navItem)
        }
      }
      return [...prev, normalizedItem]
    })
  }

  const removeNavItem = (itemId: string) => {
    setNavigation(prev => prev.filter(item => item.id !== itemId))
  }

  const moveNavItem = (fromIndex: number, toIndex: number) => {
    setNavigation(prev => {
      const newNav = [...prev]
      const [removed] = newNav.splice(fromIndex, 1)
      newNav.splice(toIndex, 0, removed)
      return newNav
    })
  }

  const updateNavItem = (itemId: string, updates: Partial<NavItem>) => {
    const normalizedUpdates = {
      ...updates,
      href: updates.href?.startsWith('/') ? updates.href : updates.href ? `/${updates.href}` : updates.href
    }
    
    setNavigation(prev => {
      if (updates.parentNavId) {
        const item = prev.find(i => i.id === itemId)
        if (!item) return prev
        
        const parentItem = prev.find(i => i.id === updates.parentNavId)
        if (!parentItem) return prev
        
        const withoutItem = prev.filter(i => i.id !== itemId)
        const normalizedItem = {
          ...item,
          ...normalizedUpdates,
          href: normalizedUpdates.href ? normalizedUpdates.href : (item.href?.startsWith('/') ? item.href : `/${item.href || ''}`)
        }
        
        const updatedParent: NavItem = {
          ...parentItem,
          type: 'dropdown',
          children: [
            ...(parentItem.children || []),
            { ...normalizedItem, parentNavId: updates.parentNavId }
          ]
        }
        
        return withoutItem.map(i => i.id === updates.parentNavId ? updatedParent : i)
      } else {
        return prev.map(item => item.id === itemId ? { ...item, ...normalizedUpdates } : item)
      }
    })
  }

  const removeNavItemFromParent = (itemId: string) => {
    setNavigation(prev => prev.map(item => {
      if (item.children?.some(c => c.id === itemId)) {
        const childItem = item.children?.find(c => c.id === itemId)
        return {
          ...item,
          children: item.children?.filter(c => c.id !== itemId),
          type: (item.children?.length || 0) <= 1 ? 'link' as const : item.type
        }
      }
      return item
    }))
  }

  const moveNavItemToParent = (childId: string, newParentId?: string) => {
    setNavigation(prev => {
      let child: NavItem | undefined
      const withoutChild = prev.map(item => {
        if (item.children?.some(c => c.id === childId)) {
          child = item.children?.find(c => c.id === childId)
          const newChildren = item.children?.filter(c => c.id !== childId) || []
          return {
            ...item,
            children: newChildren.length > 0 ? newChildren : undefined,
            type: newChildren.length > 0 ? item.type : 'link' as const
          }
        }
        return item
      })

      if (!child) return prev

      const normalizedChild = {
        ...child,
        href: child.href?.startsWith('/') ? child.href : `/${child.href || ''}`
      }

      if (newParentId) {
        return withoutChild.map(item => {
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
          return item
        })
      } else {
        return [...withoutChild, { ...child, parentNavId: undefined }]
      }
    })
  }

  const moveChildItem = (parentId: string, fromIndex: number, toIndex: number) => {
    setNavigation(prev => prev.map(item => {
      if (item.id === parentId && item.children) {
        const newChildren = [...item.children]
        const [removed] = newChildren.splice(fromIndex, 1)
        newChildren.splice(toIndex, 0, removed)
        return { ...item, children: newChildren }
      }
      return item
    }))
  }

  const updateContactInfo = (info: Partial<ContactInfo>) => {
    setContactInfo(prev => ({ ...prev, ...info }))
  }

  const addCase = (caseItem: Case) => {
    setCases(prev => [...prev, caseItem])
  }

  const updateCase = (id: string, updates: Partial<Case>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id))
  }

  const addTestimonial = (testimonial: Testimonial) => {
    setTestimonials(prev => [...prev, testimonial])
  }

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id))
  }

  const addCompanyLogo = (logo: CompanyLogo) => {
    setCompanyLogos(prev => [...prev, logo])
  }

  const updateCompanyLogo = (id: string, updates: Partial<CompanyLogo>) => {
    setCompanyLogos(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const deleteCompanyLogo = (id: string) => {
    setCompanyLogos(prev => prev.filter(l => l.id !== id))
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
