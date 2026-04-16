'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Layout, 
  Image, 
  MessageSquare, 
  BarChart3, 
  Megaphone,
  GripVertical,
  Plus,
  Trash2,
  Save,
  LogOut,
  Type,
  Settings,
  Eye,
  ArrowLeft,
  Globe,
  Search,
  Link2,
  ChevronDown,
  Menu,
  Pencil,
  X,
  RefreshCw,
  Check,
  Mail,
  Phone,
  MapPin,
  Building2,
  FilePlus,
  FileText,
  FileX,
  Briefcase,
  Quote,
  Users,
  Folder,
  Film,
  Music,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Loader2,
  Upload,
  Headphones
} from 'lucide-react'
import { useCMS, CMSBlock, NavItem, Case, Testimonial, CompanyLogo } from '@/lib/cms'
import { uploadImage } from '@/lib/supabase'

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

type FooterLink = {
  id: string
  label: string
  href: string
}



const blockTypes = [
  { type: 'hero', label: 'Hero', icon: Layout, description: 'Stor header med titel og CTA' },
  { type: 'text', label: 'Tekst', icon: Type, description: 'Titel og tekstafsnit' },
  { type: 'contentImage', label: 'Indhold + Billede', icon: ImageIcon, description: '2 kolonner med tekst og billede' },
  { type: 'services', label: 'Services', icon: Settings, description: 'Vis ydelser i grid' },
  { type: 'testimonials', label: 'Anmeldelser', icon: MessageSquare, description: 'Kundeudtalelser slider' },
  { type: 'stats', label: 'Statistik', icon: BarChart3, description: 'Tal og statistik' },
  { type: 'gallery', label: 'Galleri', icon: Image, description: 'Billedgalleri' },
  { type: 'cta', label: 'CTA', icon: Megaphone, description: 'Call to action sektion' },
  { type: 'contact', label: 'Kontakt', icon: FileText, description: 'Kontaktformular' },
]

function Dashboard() {
  const { pages, navigation, users, contactInfo, isAuthenticated, currentUser, supabaseReady, logout, createPage, updatePageDetails, deletePage, addBlock, removeBlock, moveBlock, updateBlockContent, updatePageMeta, moveNavItem, updateNavItem, addNavItem, removeNavItem, removeNavItemFromParent, updateNavigation, moveNavItemToParent, moveChildItem, convertToDropdown, addUser, updateUser, updateUserPassword, deleteUser, generatePassword, fetchUsers, updateContactInfo, cases, testimonials, companyLogos, addCase, updateCase, deleteCase, addTestimonial, updateTestimonial, deleteTestimonial, addCompanyLogo, updateCompanyLogo, deleteCompanyLogo } = useCMS()
  
  useEffect(() => {
    if (supabaseReady && users.length === 0) {
      fetchUsers()
    }
  }, [supabaseReady])
  
  const router = useRouter()
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggingFromPanel, setDraggingFromPanel] = useState(false)
  const [panelSelectedType, setPanelSelectedType] = useState<CMSBlock['type'] | null>(null)
  const [showComponentPicker, setShowComponentPicker] = useState(false)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const blockEditRef = useRef<((fieldKey: string, url: string) => void) | null>(null)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingNavigation, setEditingNavigation] = useState(false)
  const [editingNavItem, setEditingNavItem] = useState<string | null>(null)
  const [navDragIndex, setNavDragIndex] = useState<number | null>(null)
  const [navDragOverIndex, setNavDragOverIndex] = useState<number | null>(null)
  const [navDragOverParent, setNavDragOverParent] = useState<string | null>(null)
  const [navDragOverItemId, setNavDragOverItemId] = useState<string | null>(null)
  const [childDragParent, setChildDragParent] = useState<string | null>(null)
  const [childDragIndex, setChildDragIndex] = useState<number | null>(null)
  const [childDragOverIndex, setChildDragOverIndex] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showCreatePage, setShowCreatePage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [newPageParent, setNewPageParent] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmType, setDeleteConfirmType] = useState<string>('page')
  const [editingPageDetails, setEditingPageDetails] = useState<{ slug: string; title: string; pageSlug: string; parentSlug: string } | null>(null)
  const [showAddNavItem, setShowAddNavItem] = useState(false)
  const [newNavItemParent, setNewNavItemParent] = useState<string>('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [createdUserInfo, setCreatedUserInfo] = useState<{email: string; password: string} | null>(null)
  const [editingContactInfo, setEditingContactInfo] = useState(false)
  const [pagesCollapsed, setPagesCollapsed] = useState(false)
  const [editingCases, setEditingCases] = useState(false)
  const [editingTestimonials, setEditingTestimonials] = useState(false)
  const [editingCompanyLogos, setEditingCompanyLogos] = useState(false)
  const [editingMediaLibrary, setEditingMediaLibrary] = useState(false)
  const [editingHeaderFooter, setEditingHeaderFooter] = useState(false)
  const [editingCase, setEditingCase] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)
  const [editingLogo, setEditingLogo] = useState<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'favicon' | 'image' | 'video'>('logo')
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{filter: string, fieldKey: string, blockId: string | null} | null>(null)

  const handleOpenMediaPicker = useCallback((filter: string, fieldKey: string) => {
    setMediaPickerTarget(filter as any)
    const currentBlockId = editingBlock
    setMediaPickerConfig({ filter, fieldKey, blockId: currentBlockId })
    setShowMediaPicker(true)
  }, [editingBlock])
  
  const handleOpenLogoPicker = useCallback(() => {
    setMediaPickerTarget('logo')
    setMediaPickerConfig(null)
    setShowMediaPicker(true)
  }, [])
  
  const handleOpenFaviconPicker = useCallback(() => {
    setMediaPickerTarget('favicon')
    setMediaPickerConfig(null)
    setShowMediaPicker(true)
  }, [])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [blockDeleteConfirm, setBlockDeleteConfirm] = useState<{ pageSlug: string; blockId: string } | null>(null)

  const uploadToMediaLibrary = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      return data.file?.url || null
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const updateContactForm = (updates: Partial<typeof contactForm>) => {
    setContactForm(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const [contactForm, setContactForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    cvr: '',
    logo: '',
    favicon: '',
    headerButtonText: '',
    footerDescription: '',
    footerCol2Title: '',
    footerCol3Title: '',
    footerCol4Title: '',
    footerCol2Links: [] as FooterLink[],
    footerCol3Links: [] as FooterLink[],
    footerCol4Links: [] as FooterLink[]
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login')
    } else {
      setIsReady(true)
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-pulse text-slate-500">Indlæser...</div>
      </div>
    )
  }

  const currentPage = pages.find(p => p.slug === selectedPage)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setDraggingFromPanel(false)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex && selectedPage) {
      moveBlock(selectedPage, draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handlePanelDragStart = (type: CMSBlock['type']) => {
    setDraggingFromPanel(true)
    setDraggedIndex(-1)
    setPanelSelectedType(type)
  }

  const getDefaultContent = (type: CMSBlock['type']): Record<string, any> => {
    switch (type) {
      case 'hero': return { title: 'Ny hero sektion', subtitle: 'Beskrivelse...' }
      case 'text': return { title: 'Ny overskrift', body: 'Tekst indhold...' }
      case 'contentImage': return { title: 'Ny overskrift', description: 'Beskrivelse her...', buttonText: 'Læs mere', layout: 'image-left' }
      case 'cta': return { title: 'Klar til at komme i gang?', buttonText: 'Kontakt os' }
      case 'stats': return {
        stats: [
          { id: generateId('stat-0'), number: '50+', label: 'Projekter' },
          { id: generateId('stat-1'), number: '100%', label: 'Tilfredse' },
          { id: generateId('stat-2'), number: '5+', label: 'Års erfaring' },
          { id: generateId('stat-3'), number: '24/7', label: 'Support' },
        ]
      }
      case 'gallery': return {
        items: [
          { id: generateId('gallery-0'), title: 'Projekt 1', category: 'Hjemmeside' },
          { id: generateId('gallery-1'), title: 'Projekt 2', category: 'Webshop' },
          { id: generateId('gallery-2'), title: 'Projekt 3', category: 'Meta Ads' },
        ]
      }
      default: return {}
    }
  }

  const handlePanelDrop = (index?: number) => {
    if (draggingFromPanel && selectedPage && panelSelectedType) {
      const newBlock: CMSBlock = {
        id: generateId(panelSelectedType),
        type: panelSelectedType,
        content: getDefaultContent(panelSelectedType)
      }
      addBlock(selectedPage, newBlock, index)
    }
    setDraggingFromPanel(false)
    setDraggedIndex(null)
    setPanelSelectedType(null)
  }

  const addBlockFromPanel = (type: CMSBlock['type']) => {
    if (!selectedPage) return
    const newBlock: CMSBlock = {
      id: generateId(type),
      type: type,
      content: getDefaultContent(type)
    }
    addBlock(selectedPage, newBlock, currentPage?.blocks.length)
    setShowComponentPicker(false)
  }

  const handleSave = () => {
    if (editingContactInfo || editingHeaderFooter) {
      updateContactInfo(contactForm)
    }
    setHasUnsavedChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getBlockIcon = (type: string) => {
    const blockType = blockTypes.find(b => b.type === type)
    const Icon = blockType?.icon || Layout
    return <Icon size={18} />
  }

  const getBlockLabel = (type: string) => {
    return blockTypes.find(b => b.type === type)?.label || type
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft size={20} />
              <span className="text-sm">Tilbage til site</span>
            </Link>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">StayMain CMS</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                  {currentUser.email}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowSupport(true)}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Headphones size={18} />
              Support
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges && !saved}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                saved 
                  ? 'bg-green-500 text-white' 
                  : hasUnsavedChanges
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              {saved ? 'Gemt!' : 'Gem ændringer'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut size={18} className="inline mr-2" />
              Log ud
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sider
              </h2>
              <button
                onClick={() => setPagesCollapsed(!pagesCollapsed)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                <ChevronDown size={16} className={`transition-transform ${pagesCollapsed ? '-rotate-90' : ''}`} />
              </button>
            </div>
            {!pagesCollapsed && (
            <nav className="space-y-1">
              {(() => {
                const rootPages = pages.filter(p => !p.parentSlug).sort((a, b) => {
                  if (a.slug === 'home') return -1
                  if (b.slug === 'home') return 1
                  if (a.slug === 'ydelser') return -1
                  if (b.slug === 'ydelser') return 1
                  return a.slug.localeCompare(b.slug)
                })
                
                const getChildren = (parentSlug: string) => {
                  return pages
                    .filter(p => p.parentSlug === parentSlug)
                    .sort((a, b) => a.slug.localeCompare(b.slug))
                }
                
                const renderPage = (page: typeof pages[0], depth: number = 0) => {
                  const indentClass = depth === 0 ? '' : depth === 1 ? 'pl-6' : 'pl-8'
                  const parentExists = page.parentSlug ? pages.some(p => p.slug === page.parentSlug) : true
                  const children = getChildren(page.slug)
                  
                  return (
                    <div key={page.slug}>
                      <div
                        onClick={() => { setSelectedPage(page.slug); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(false); setEditingHeaderFooter(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group cursor-pointer ${indentClass} ${
                          selectedPage === page.slug && !editingNavigation
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {depth > 0 && <span className="text-slate-400 flex-shrink-0 text-xs">↳</span>}
                          <span className="text-sm font-medium truncate">{page.title}</span>
                          {!parentExists && page.parentSlug && (
                            <span className="text-xs text-amber-500 flex-shrink-0">⚠️</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingPageDetails({ slug: page.slug, title: page.title, pageSlug: page.slug.split('/').pop() || '', parentSlug: page.parentSlug || '' }) }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-opacity"
                          >
                            <Pencil size={14} />
                          </button>
                          {page.slug !== 'home' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(page.slug) }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                            >
                              <FileX size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {children.map(child => renderPage(child, depth + 1))}
                    </div>
                  )
                }
                
                return rootPages.map(page => renderPage(page))
              })()}
              <button
                onClick={() => setShowCreatePage(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors mt-2"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Opret ny side</span>
              </button>
            </nav>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Indhold
              </h2>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(true); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(false); setEditingHeaderFooter(false); setContactForm({ companyName: contactInfo.companyName, email: contactInfo.email, phone: contactInfo.phone, address: contactInfo.address, cvr: contactInfo.cvr, logo: contactInfo.logo || '', favicon: contactInfo.favicon || '', headerButtonText: contactInfo.headerButtonText, footerDescription: contactInfo.footerDescription, footerCol2Title: contactInfo.footerCol2Title, footerCol3Title: contactInfo.footerCol3Title, footerCol4Title: contactInfo.footerCol4Title, footerCol2Links: contactInfo.footerCol2Links, footerCol3Links: contactInfo.footerCol3Links, footerCol4Links: contactInfo.footerCol4Links }) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingContactInfo
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Generelle oplysninger</span>
              </button>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(true); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingCases
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Briefcase size={18} />
                <span className="text-sm font-medium">Cases</span>
              </button>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(true); setEditingCompanyLogos(false); setEditingMediaLibrary(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingTestimonials
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Quote size={18} />
                <span className="text-sm font-medium">Kundeudtalelser</span>
              </button>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(true); setEditingMediaLibrary(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingCompanyLogos
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Users size={18} />
                <span className="text-sm font-medium">Firmalogoer</span>
              </button>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(true) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingMediaLibrary
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Folder size={18} />
                <span className="text-sm font-medium">Mediebibliotek</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Navigation
              </h2>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(true); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(false); setEditingHeaderFooter(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingNavigation
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Menu size={18} />
                <span className="text-sm font-medium">Rediger menu</span>
              </button>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setEditingMediaLibrary(false); setEditingHeaderFooter(true); setContactForm({ ...contactInfo, logo: contactInfo.logo || '', favicon: contactInfo.favicon || '', headerButtonText: contactInfo.headerButtonText || '', footerDescription: contactInfo.footerDescription || '', footerCol2Title: contactInfo.footerCol2Title || '', footerCol3Title: contactInfo.footerCol3Title || '', footerCol4Title: contactInfo.footerCol4Title || '', footerCol2Links: contactInfo.footerCol2Links || [], footerCol3Links: contactInfo.footerCol3Links || [], footerCol4Links: contactInfo.footerCol4Links || [] }) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingHeaderFooter
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Layout size={18} />
                <span className="text-sm font-medium">Header / Footer</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Brugere
              </h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Opret bruger</span>
              </button>
              <div className="mt-2 space-y-1">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setEditingUser(user.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 text-xs font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{user.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {editingNavigation && (
            <>
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Rediger navigation
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Træk elementer for at ændre rækkefølgen.
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {navigation.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                      Ingen navigationspunkter endnu. Tilføj et for at komme i gang.
                    </p>
                  )}
                  
                  {navigation.map((item, index) => {
                    const isDropTarget = navDragIndex !== null && navDragIndex !== index && navDragOverIndex === index
                    const isParentTarget = navDragOverParent === item.id
                    
                    return (
                      <div key={item.id}>
                        <div
                          draggable={navDragIndex === null || navDragIndex !== index}
                          onDragStart={() => setNavDragIndex(index)}
                          onDragEnd={() => {
                            setNavDragIndex(null)
                            setNavDragOverIndex(null)
                            setNavDragOverParent(null)
                            setNavDragOverItemId(null)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            if (navDragIndex !== null && navDragIndex !== index) {
                              setNavDragOverIndex(index)
                              if (item.type === 'link') {
                                setNavDragOverItemId(item.id)
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (navDragIndex !== null && navDragIndex !== index) {
                              const draggedItem = navigation[navDragIndex]
                              if (draggedItem && draggedItem.id !== item.id) {
                                if (item.type === 'dropdown') {
                                  moveNavItemToParent(draggedItem.id, item.id)
                                } else {
                                  convertToDropdown(item.id, draggedItem.id)
                                }
                              }
                            }
                            setNavDragIndex(null)
                            setNavDragOverIndex(null)
                            setNavDragOverItemId(null)
                          }}
                          className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-4 transition-all ${
                            isDropTarget
                              ? 'border-blue-500 shadow-lg'
                              : navDragOverItemId === item.id
                                ? 'border-2 border-dashed border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                          } ${navDragIndex === index ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical size={20} className="text-slate-400 cursor-grab" />
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                  {item.label}
                                  {item.type === 'dropdown' && (
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                                      Dropdown
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {item.pageSlug ? `Side: ${item.pageSlug}` : item.href || 'Ingen link'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingNavItem(item.id)}
                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Rediger"
                              >
                                <Pencil size={18} />
                              </button>
                              {item.children && item.children.length > 0 && (
                                <span className="text-xs text-slate-400">
                                  {item.children.length} underpunkter
                                </span>
                              )}
                              <button
                                onClick={() => { setDeleteConfirm(item.id); setDeleteConfirmType('nav') }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Slet"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          
                          {item.children && item.children.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50 mt-4"
                              onDragOver={(e) => {
                                e.preventDefault()
                                if (navDragIndex !== null) {
                                  setNavDragOverIndex(index)
                                  setNavDragOverParent(item.id)
                                }
                              }}
                              onDragLeave={() => {
                                if (navDragOverParent === item.id) {
                                  setNavDragOverParent(null)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                if (navDragIndex !== null) {
                                  const draggedItem = navigation[navDragIndex]
                                  if (draggedItem && draggedItem.id !== item.id) {
                                    moveNavItemToParent(draggedItem.id, item.id)
                                  }
                                }
                                setNavDragIndex(null)
                                setNavDragOverIndex(null)
                                setNavDragOverParent(null)
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500">Underpunkter:</p>
                                <button
                                  onClick={() => {
                                    addNavItem({
                                      id: `nav-${Date.now()}`,
                                      label: 'Nyt underpunkt',
                                      type: 'link',
                                      href: '/ny-side'
                                    }, item.id)
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-600"
                                >
                                  + Tilføj underpunkt
                                </button>
                              </div>
                              <div className="space-y-2">
                                {item.children.map((child, childIndex) => (
                                  <div
                                    key={child.id}
                                    draggable
                                    onDragStart={() => {
                                      setChildDragParent(item.id)
                                      setChildDragIndex(childIndex)
                                    }}
                                    onDragEnd={() => {
                                      setChildDragParent(null)
                                      setChildDragIndex(null)
                                      setChildDragOverIndex(null)
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      if (childDragParent === item.id && childDragIndex !== childIndex) {
                                        setChildDragOverIndex(childIndex)
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault()
                                      if (childDragParent === item.id && childDragIndex !== null && childDragIndex !== childIndex) {
                                        moveChildItem(item.id, childDragIndex, childIndex)
                                      }
                                      setChildDragParent(null)
                                      setChildDragIndex(null)
                                      setChildDragOverIndex(null)
                                    }}
                                    className={`flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-lg transition-all cursor-grab ${
                                      childDragParent === item.id && childDragIndex === childIndex ? 'opacity-50' : ''
                                    } ${
                                      childDragParent === item.id && childDragOverIndex === childIndex ? 'border-2 border-blue-500' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <GripVertical size={14} className="text-slate-400" />
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                      {child.label}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setEditingNavItem(child.id)}
                                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                        title="Rediger"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => moveNavItemToParent(child.id)}
                                        className="p-1 text-slate-400 hover:text-purple-500 transition-colors"
                                        title="Flyt til hovedmenu"
                                      >
                                        <ArrowLeft size={14} />
                                      </button>
                                      <button
                                        onClick={() => removeNavItemFromParent(child.id)}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  <button
                    onClick={() => setShowAddNavItem(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Tilføj navigationspunkt
                  </button>
                </div>
              </div>
            </>
          )}

          {editingContactInfo && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Rediger generelle oplysninger
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Virksomhedsnavn</label>
                    <input
                      type="text"
                      value={contactForm.companyName}
                      onChange={e => updateContactForm({ companyName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={e => updateContactForm({ email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={e => updateContactForm({ phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={e => updateContactForm({ address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVR-nummer</label>
                    <input
                      type="text"
                      value={contactForm.cvr}
                      onChange={e => updateContactForm({ cvr: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo</label>
                    {contactForm.logo && <img src={contactForm.logo} alt="Logo" className="w-full h-24 object-contain mb-2 bg-white rounded-lg p-2" />}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleOpenLogoPicker}
                        className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Folder size={18} className="mr-2 text-slate-400" />
                        <span className="text-slate-500">Mediebibliotek</span>
                      </button>
                      <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={async e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setUploadingLogo(true)
                            const url = await uploadToMediaLibrary(file)
                            if (url) updateContactForm({ logo: url })
                            setUploadingLogo(false)
                          }
                        }} />
                        <Upload size={18} className="mr-2 text-slate-400" />
                        <span className="text-slate-500">{uploadingLogo ? 'Uploader...' : 'Upload fra pc'}</span>
                      </label>
                    </div>
                    {contactForm.logo && (
                      <button
                        type="button"
                        onClick={() => updateContactForm({ logo: '' })}
                        className="mt-2 text-sm text-red-500 hover:text-red-600"
                      >
                        Fjern logo
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Favicon</label>
                    {contactForm.favicon && <img src={contactForm.favicon} alt="Favicon" className="w-12 h-12 object-contain mb-2 bg-white rounded-lg p-1" />}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleOpenFaviconPicker}
                        className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Folder size={18} className="mr-2 text-slate-400" />
                        <span className="text-slate-500">Mediebibliotek</span>
                      </button>
                      <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={async e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setUploadingFavicon(true)
                            const url = await uploadToMediaLibrary(file)
                            if (url) updateContactForm({ favicon: url })
                            setUploadingFavicon(false)
                          }
                        }} />
                        <Upload size={18} className="mr-2 text-slate-400" />
                        <span className="text-slate-500">{uploadingFavicon ? 'Uploader...' : 'Upload fra pc'}</span>
                      </label>
                    </div>
                    {contactForm.favicon && (
                      <button
                        type="button"
                        onClick={() => updateContactForm({ favicon: '' })}
                        className="mt-2 text-sm text-red-500 hover:text-red-600"
                      >
                        Fjern favicon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {editingHeaderFooter && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Rediger header og footer
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Header</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Knap tekst</label>
                        <input
                          type="text"
                          value={contactForm.headerButtonText}
                          onChange={e => updateContactForm({ headerButtonText: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Footer</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse</label>
                        <input
                          type="text"
                          value={contactForm.footerDescription}
                          onChange={e => updateContactForm({ footerDescription: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kolonne 2 (Navigation)</h4>
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol2Title}
                          onChange={e => updateContactForm({ footerCol2Title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Links</label>
                        <div className="space-y-2">
                          {(contactForm.footerCol2Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol2Links || [])]
                                    newLinks[index] = { ...newLinks[index], label: e.target.value }
                                    updateContactForm({ footerCol2Links: newLinks })
                                  }}
                                  placeholder="Label"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={link.href}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol2Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol2Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol2Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol2Links: newLinks })
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newLink: FooterLink = {
                                id: `footer-col2-${Date.now()}`,
                                label: 'Ny link',
                                href: '#'
                              }
                              updateContactForm({ footerCol2Links: [...(contactForm.footerCol2Links || []), newLink] })
                            }}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kolonne 3 (Services)</h4>
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol3Title}
                          onChange={e => updateContactForm({ footerCol3Title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Links</label>
                        <div className="space-y-2">
                          {(contactForm.footerCol3Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol3Links || [])]
                                    newLinks[index] = { ...newLinks[index], label: e.target.value }
                                    updateContactForm({ footerCol3Links: newLinks })
                                  }}
                                  placeholder="Label"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={link.href}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol3Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol3Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol3Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol3Links: newLinks })
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newLink: FooterLink = {
                                id: `footer-col3-${Date.now()}`,
                                label: 'Ny service',
                                href: '#'
                              }
                              updateContactForm({ footerCol3Links: [...(contactForm.footerCol3Links || []), newLink] })
                            }}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kolonne 4</h4>
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol4Title}
                          onChange={e => updateContactForm({ footerCol4Title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Links</label>
                        <div className="space-y-2">
                          {(contactForm.footerCol4Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol4Links || [])]
                                    newLinks[index] = { ...newLinks[index], label: e.target.value }
                                    updateContactForm({ footerCol4Links: newLinks })
                                  }}
                                  placeholder="Label"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={link.href}
                                  onChange={e => {
                                    const newLinks = [...(contactForm.footerCol4Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol4Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol4Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol4Links: newLinks })
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newLink: FooterLink = {
                                id: `footer-col4-${Date.now()}`,
                                label: 'Ny link',
                                href: '#'
                              }
                              updateContactForm({ footerCol4Links: [...(contactForm.footerCol4Links || []), newLink] })
                            }}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editingCases && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cases</h2>
                  <button
                    onClick={() => {
                      const newCase: Case = {
                        id: `case-${Date.now()}`,
                        title: 'Ny case',
                        image: ''
                      }
                      addCase(newCase)
                      setEditingCase(newCase.id)
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Tilføj case
                  </button>
                </div>
                
                {cases.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>Ingen cases endnu</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map(caseItem => (
                      <div key={caseItem.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        {caseItem.image && (
                          <img src={caseItem.image} alt={caseItem.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}
                        <h3 className="font-semibold text-slate-900 dark:text-white">{caseItem.title}</h3>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setEditingCase(caseItem.id)}
                            className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(caseItem.id); setDeleteConfirmType('case') }}
                            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {editingTestimonials && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Kundeudtalelser</h2>
                  <button
                    onClick={() => {
                      const newTestimonial: Testimonial = {
                        id: `testimonial-${Date.now()}`,
                        name: 'Ny kunde',
                        role: 'Titel',
                        content: '',
                        image: ''
                      }
                      addTestimonial(newTestimonial)
                      setEditingTestimonial(newTestimonial.id)
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Tilføj udtalelse
                  </button>
                </div>
                
                {testimonials.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Quote size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>Ingen kundeudtalelser endnu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map(testimonial => (
                      <div key={testimonial.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-4">
                        {testimonial.image && (
                          <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingTestimonial(testimonial.id)}
                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => { setDeleteConfirm(testimonial.id); setDeleteConfirmType('testimonial') }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{testimonial.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {editingCompanyLogos && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Firmalogoer</h2>
                  <button
                    onClick={() => {
                      const newLogo: CompanyLogo = {
                        id: `logo-${Date.now()}`,
                        name: 'Nyt logo',
                        image: ''
                      }
                      addCompanyLogo(newLogo)
                      setEditingLogo(newLogo.id)
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Tilføj logo
                  </button>
                </div>
                
                {companyLogos.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>Ingen firmalogoer endnu</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {companyLogos.map(logo => (
                      <div key={logo.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        {logo.image && (
                          <img src={logo.image} alt={logo.name} className="w-full h-20 object-contain mb-2" />
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-300 text-center">{logo.name}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setEditingLogo(logo.id)}
                            className="flex-1 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(logo.id); setDeleteConfirmType('logo') }}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {editingMediaLibrary && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mediebibliotek</h2>
                </div>
                
                <MediaLibrary />
              </div>
            </div>
          )}
          
          {selectedPage === null && !editingNavigation && !editingContactInfo && !editingCases && !editingTestimonials && !editingCompanyLogos && !editingMediaLibrary && !editingHeaderFooter && (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <Layout size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Vælg en side fra menuen for at redigere</p>
              </div>
            </div>
          )}

          {currentPage && !editingNavigation && !editingContactInfo && !editingCases && !editingTestimonials && !editingCompanyLogos && !editingMediaLibrary && !editingHeaderFooter && (
            <>
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Redigerer: {currentPage.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Træk komponenter for at arrangere siden
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMeta(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Search size={18} />
                    SEO
                  </button>
                  <Link
                    href={`/${currentPage.slug === 'home' ? '' : currentPage.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                    Vis side
                  </Link>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {currentPage.blocks.map((block, index) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-move ${
                        dragOverIndex === index
                          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                      } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={20} className="text-slate-400" />
                      </div>
                      
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
                            {getBlockIcon(block.type)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {getBlockLabel(block.type)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {block.content?.title || block.content?.body?.slice(0, 30) || 'Ingen titel'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingBlock(block.id)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Rediger"
                          >
                            <Settings size={18} />
                          </button>
                          <button
                            onClick={() => setBlockDeleteConfirm({ pageSlug: currentPage.slug, blockId: block.id })}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Slet"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                        <BlockPreview block={block} />
                      </div>
                    </div>
                  ))}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(currentPage.blocks.length) }}
                    onDrop={() => handleDrop(currentPage.blocks.length)}
                    onClick={() => setShowComponentPicker(true)}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOverIndex === currentPage.blocks.length
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <Plus size={32} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {dragOverIndex === currentPage.blocks.length ? 'Slip for at tilføje' : 'Klik for at tilføje sektion'}
                    </p>
                  </div>
                </div>
              </div>

              {editingBlock && currentPage.blocks.find(b => b.id === editingBlock) && (
                <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Rediger {getBlockLabel(currentPage.blocks.find(b => b.id === editingBlock)?.type || '')}
                    </h3>
                    <button
                      onClick={() => setEditingBlock(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6">
                    <BlockEditModal
                      block={currentPage.blocks.find(b => b.id === editingBlock)!}
                      updateLocalContentRef={blockEditRef}
                      onClose={() => setEditingBlock(null)}
                      onSave={(content) => {
                        if (selectedPage) {
                          updateBlockContent(selectedPage, editingBlock, content)
                          setEditingBlock(null)
                        }
                      }}
                      onOpenMediaPicker={(filter, fieldKey) => {
                        handleOpenMediaPicker(filter, fieldKey)
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showComponentPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowComponentPicker(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Vælg komponent</h3>
              <button onClick={() => setShowComponentPicker(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {blockTypes.map((blockType) => (
                <button
                  key={blockType.type}
                  onClick={() => addBlockFromPanel(blockType.type as CMSBlock['type'])}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                >
                  <blockType.icon size={24} className="text-blue-500 mb-2" />
                  <div className="font-medium text-slate-900 dark:text-white">{blockType.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{blockType.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreatePage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePage(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Opret ny side</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Min nye side"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="min-nye-side"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Overordnet side (valgfrit)</label>
                <select
                  value={newPageParent}
                  onChange={e => setNewPageParent(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Ingen</option>
                  {pages.map(p => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreatePage(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  if (newPageTitle && newPageSlug) {
                    const page = createPage(newPageTitle, newPageSlug, newPageParent || undefined)
                    if (page) {
                      setSelectedPage(newPageSlug)
                    }
                    setShowCreatePage(false)
                    setNewPageTitle('')
                    setNewPageSlug('')
                    setNewPageParent('')
                  }
                }}
                disabled={!newPageTitle || !newPageSlug}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Opret side
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {deleteConfirmType === 'nav' ? 'Slet navigationspunkt?' : 
                 deleteConfirmType === 'child' ? 'Slet underpunkt?' :
                 deleteConfirmType === 'case' ? 'Slet case?' :
                 deleteConfirmType === 'testimonial' ? 'Slet udtalelse?' :
                 deleteConfirmType === 'logo' ? 'Slet logo?' :
                 deleteConfirmType === 'user' ? 'Slet bruger?' : 'Slet side?'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Er du sikker på at du vil slette dette? Denne handling kan ikke fortrydes.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmType === 'nav' || deleteConfirmType === 'child') {
                    removeNavItem(deleteConfirm)
                  } else if (deleteConfirmType === 'case') {
                    deleteCase(deleteConfirm)
                    setEditingCase(null)
                  } else if (deleteConfirmType === 'testimonial') {
                    deleteTestimonial(deleteConfirm)
                    setEditingTestimonial(null)
                  } else if (deleteConfirmType === 'logo') {
                    deleteCompanyLogo(deleteConfirm)
                    setEditingLogo(null)
                  } else if (deleteConfirmType === 'user') {
                    deleteUser(deleteConfirm)
                    setEditingUser(null)
                  } else {
                    deletePage(deleteConfirm)
                    if (selectedPage === deleteConfirm) {
                      setSelectedPage(pages.find(p => p.slug !== deleteConfirm)?.slug || null)
                    }
                  }
                  setDeleteConfirm(null)
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}

      {blockDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBlockDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Slet sektion?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Er du sikker på at du vil slette denne sektion? Denne handling kan ikke fortrydes.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setBlockDeleteConfirm(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  removeBlock(blockDeleteConfirm.pageSlug, blockDeleteConfirm.blockId)
                  setBlockDeleteConfirm(null)
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}

      {editingNavItem && (
        <NavItemEditModal
          item={navigation.find(n => n.id === editingNavItem) || 
            navigation.reduce((acc: NavItem | null, item) => {
              if (acc) return acc
              if (item.id === editingNavItem) return item
              if (item.children) {
                const found = item.children.find(c => c.id === editingNavItem)
                return found || null
              }
              return null
            }, null)!
          }
          pages={pages}
          onClose={() => setEditingNavItem(null)}
          onSave={(updates) => {
            updateNavItem(editingNavItem, updates)
            setEditingNavItem(null)
          }}
        />
      )}

      {editingPageDetails && (
        <PageEditModal
          page={editingPageDetails}
          pages={pages}
          onClose={() => setEditingPageDetails(null)}
          onSave={(oldSlug, title, newSlug, parentSlug) => {
            updatePageDetails(oldSlug, title, newSlug, parentSlug)
            if (selectedPage === oldSlug) {
              setSelectedPage(newSlug)
            }
            setEditingPageDetails(null)
          }}
        />
      )}

      {editingMeta && currentPage && (
        <MetaEditModal
          page={currentPage}
          onClose={() => setEditingMeta(false)}
          onSave={(meta) => {
            updatePageMeta(selectedPage!, meta)
            setEditingMeta(false)
          }}
        />
      )}

      {showAddNavItem && (
        <AddNavItemModal
          pages={pages}
          navigation={navigation}
          onClose={() => setShowAddNavItem(false)}
          onSave={(item) => {
            addNavItem(item)
            setShowAddNavItem(false)
          }}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          onClose={() => {
            setShowCreateUser(false)
            setNewUserEmail('')
            setNewUserPassword('')
          }}
          onSave={async (email, password) => {
            const result = await addUser(email, password)
            if (result.success) {
              setCreatedUserInfo({ email, password })
            }
            return result
          }}
          onGenerate={() => {
            const pwd = generatePassword()
            setNewUserPassword(pwd)
            return pwd
          }}
        />
      )}

      {createdUserInfo && (
        <CreatedUserModal
          email={createdUserInfo.email}
          password={createdUserInfo.password}
          onClose={() => setCreatedUserInfo(null)}
        />
      )}

      {editingUser && users.find(u => u.id === editingUser) && (
        <EditUserModal
          user={users.find(u => u.id === editingUser)!}
          onClose={() => setEditingUser(null)}
          onSaveEmail={async (email) => {
            const result = await updateUser(editingUser, email)
            if (result.success) {
              fetchUsers()
            }
            return result
          }}
          onSavePassword={async (password) => {
            const result = await updateUserPassword(editingUser, password)
            return result
          }}
          onDelete={async () => {
            const result = await deleteUser(editingUser)
            if (result.success) {
              setEditingUser(null)
              fetchUsers()
            }
            return result
          }}
          usersLength={users.length}
        />
      )}

      {editingCase && cases.find(c => c.id === editingCase) && (
        <EditCaseModal
          caseItem={cases.find(c => c.id === editingCase)!}
          onClose={() => setEditingCase(null)}
          onSave={(updates) => {
            updateCase(editingCase, updates)
            setEditingCase(null)
          }}
          onDelete={() => {
            setDeleteConfirm(editingCase)
            setDeleteConfirmType('case')
          }}
        />
      )}

      {editingTestimonial && testimonials.find(t => t.id === editingTestimonial) && (
        <EditTestimonialModal
          testimonial={testimonials.find(t => t.id === editingTestimonial)!}
          onClose={() => setEditingTestimonial(null)}
          onSave={(updates) => {
            updateTestimonial(editingTestimonial, updates)
            setEditingTestimonial(null)
          }}
          onDelete={() => {
            setDeleteConfirm(editingTestimonial)
            setDeleteConfirmType('testimonial')
          }}
        />
      )}

      {showMediaPicker && (
        <MediaPickerModal
          filter={mediaPickerTarget === 'logo' || mediaPickerTarget === 'favicon' ? 'image' : mediaPickerTarget}
          onSelect={(url) => {
            if (mediaPickerTarget === 'logo') {
              updateContactForm({ logo: url })
            } else if (mediaPickerTarget === 'favicon') {
              updateContactForm({ favicon: url })
            } else if (mediaPickerConfig && mediaPickerConfig.blockId && selectedPage) {
              const blockId = mediaPickerConfig.blockId
              const block = currentPage?.blocks.find(b => b.id === blockId)
              if (block) {
                updateBlockContent(selectedPage, blockId, {
                  ...block.content,
                  [mediaPickerConfig.fieldKey]: url
                })
              }
              if (blockEditRef.current) {
                blockEditRef.current(mediaPickerConfig.fieldKey, url)
              }
            }
            setShowMediaPicker(false)
            setMediaPickerConfig(null)
          }}
          onClose={() => {
            setShowMediaPicker(false)
            setMediaPickerConfig(null)
          }}
        />
      )}

      {editingLogo && companyLogos.find(l => l.id === editingLogo) && (
        <EditLogoModal
          logo={companyLogos.find(l => l.id === editingLogo)!}
          onClose={() => setEditingLogo(null)}
          onSave={(updates) => {
            updateCompanyLogo(editingLogo, updates)
            setEditingLogo(null)
          }}
          onDelete={() => {
            setDeleteConfirm(editingLogo)
            setDeleteConfirmType('logo')
          }}
        />
      )}

      {showSupport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupport(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Support</h3>
              <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              <a
                href={`tel:${contactInfo.phone}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                <Phone size={18} />
                {contactInfo.phone || 'Intet telefonnummer'}
              </a>
              <a
                href={`mailto:${contactInfo.email}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
              >
                <Mail size={18} />
                {contactInfo.email || 'Ingen email'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockPreview({ block }: { block: CMSBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {block.content?.title || 'Hero Titel'}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {block.content?.subtitle || 'Undertekst'}
          </div>
        </div>
      )
    case 'text':
      return (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{block.content?.title}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{block.content?.body}</div>
        </div>
      )
    case 'cta':
      return (
        <div className="py-4">
          <div className="font-semibold text-slate-900 dark:text-white">{block.content?.title}</div>
          <div className="text-sm text-slate-500 mt-1 line-clamp-2">{block.content?.description}</div>
        </div>
      )
    case 'contentImage':
      return (
        <div className="py-4">
          <div className="font-semibold text-slate-900 dark:text-white">{block.content?.title || 'Indhold + Billede'}</div>
          <div className="text-sm text-slate-500 mt-1 line-clamp-2">{block.content?.description}</div>
          <div className="text-xs text-slate-400 mt-1">Layout: {block.content?.layout === 'image-right' ? 'Billede til højre' : 'Billede til venstre'}</div>
        </div>
      )
    default:
      return (
        <div className="text-center py-4 text-slate-500 dark:text-slate-400">
          {getBlockLabel(block.type)} preview
        </div>
      )
  }
}

function getBlockLabel(type: string) {
  return blockTypes.find(b => b.type === type)?.label || type
}

function BlockEditModal({ block, onClose, onSave, onOpenMediaPicker, updateLocalContentRef }: { block: CMSBlock; onClose: () => void; onSave: (content: Record<string, any>) => void; onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void; updateLocalContentRef?: React.MutableRefObject<((fieldKey: string, url: string) => void) | null> }) {
  const [localContent, setLocalContent] = useState(block.content || {})
  const mediaPickerOpenRef = useRef(false)
  
  useEffect(() => {
    if (!mediaPickerOpenRef.current) {
      setLocalContent(block.content || {})
    }
  }, [JSON.stringify(block.content)])

  const handleSave = () => {
    const contentToSave = { ...localContent }
    if (!contentToSave.backgroundVideo) {
      contentToSave.backgroundVideo = null
      if (contentToSave.backgroundType === 'video') {
        contentToSave.backgroundType = 'gradient'
      }
    }
    if (!contentToSave.backgroundImage) {
      contentToSave.backgroundImage = null
    }
    onSave(contentToSave)
  }

  const handleMediaClick = (fieldKey: string) => {
    mediaPickerOpenRef.current = true
    onOpenMediaPicker?.(fieldKey === 'backgroundVideo' ? 'video' : 'image', fieldKey)
  }

  useEffect(() => {
    if (updateLocalContentRef) {
      updateLocalContentRef.current = (fieldKey: string | null, url?: string) => {
        if (fieldKey === null) {
          mediaPickerOpenRef.current = false
          return
        }
        setLocalContent(prev => {
          const newContent = { ...prev, [fieldKey]: url }
          if (fieldKey === 'backgroundVideo' && url) {
            newContent.backgroundType = 'video'
          } else if (fieldKey === 'backgroundImage' && url) {
            newContent.backgroundType = 'image'
          }
          return newContent
        })
      }
    }
  }, [updateLocalContentRef])

  return (
    <div className="space-y-4">
      {block.type === 'hero' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Badge</label>
            <input
              type="text"
              value={localContent.badge || ''}
              onChange={e => setLocalContent({ ...localContent, badge: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="f.eks. Webbureau i Danmark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (H1)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse</label>
            <textarea
              value={localContent.description || localContent.subtitle || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value, subtitle: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Beskrivelse af sektionen..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tekstjustering</label>
            <select
              value={localContent.alignment || 'center'}
              onChange={e => setLocalContent({ ...localContent, alignment: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="center">Centreret</option>
              <option value="left">Venstre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Baggrundstype</label>
            <select
              value={localContent.backgroundType || 'gradient'}
              onChange={e => setLocalContent({ ...localContent, backgroundType: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="gradient">Gradient</option>
              <option value="image">Baggrundsbillede</option>
              <option value="video">Baggrundsvideo</option>
            </select>
          </div>
          {localContent.backgroundType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Baggrundsbillede</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localContent.backgroundImage || ''}
                  onChange={e => setLocalContent({ ...localContent, backgroundImage: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="/images/hero.jpg"
                />
                <button
                  type="button"
                  onClick={() => handleMediaClick('backgroundImage')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ImageIcon size={16} />
                  Vælg
                </button>
              </div>
              {localContent.backgroundImage && (
                <div className="mt-2 relative">
                  <img src={localContent.backgroundImage} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newContent = { ...localContent }
                      delete newContent.backgroundImage
                      setLocalContent(newContent)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
          {localContent.backgroundType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Baggrundsvideo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localContent.backgroundVideo || ''}
                  onChange={e => setLocalContent({ ...localContent, backgroundVideo: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="/videos/hero.mp4"
                />
                <button
                  type="button"
                  onClick={() => handleMediaClick('backgroundVideo')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Film size={16} />
                  Vælg
                </button>
              </div>
              {localContent.backgroundVideo && (
                <div className="mt-2 relative">
                  <video src={localContent.backgroundVideo} className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newContent = { ...localContent }
                      delete newContent.backgroundVideo
                      if (newContent.backgroundType === 'video') {
                        newContent.backgroundType = 'gradient'
                      }
                      setLocalContent(newContent)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
          {(localContent.backgroundType === 'image' || localContent.backgroundType === 'video') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Overlay dækning (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={localContent.backgroundOverlay ?? 0.5}
                onChange={e => setLocalContent({ ...localContent, backgroundOverlay: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Knapper</h4>
            {[1, 2].map((num) => (
              <div key={num} className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Knap {num}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={localContent[`button${num}Label`] || ''}
                    onChange={e => setLocalContent({ ...localContent, [`button${num}Label`]: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    placeholder={`Knap ${num} tekst`}
                  />
                  <input
                    type="text"
                    value={localContent[`button${num}Href`] || ''}
                    onChange={e => setLocalContent({ ...localContent, [`button${num}Href`]: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    placeholder="URL (f.eks. /hjemmeside)"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="showStats"
              checked={localContent.showStats !== false}
              onChange={e => setLocalContent({ ...localContent, showStats: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="showStats" className="text-sm text-slate-700 dark:text-slate-300">Vis statistik</label>
          </div>
          {localContent.showStats !== false && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Statistik</h4>
              {[1, 2, 3].map((num) => (
                <div key={num} className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Stat {num}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={localContent[`stat${num}Number`] || ''}
                      onChange={e => setLocalContent({ ...localContent, [`stat${num}Number`]: e.target.value })}
                      className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      placeholder="50+"
                    />
                    <input
                      type="text"
                      value={localContent[`stat${num}Label`] || ''}
                      onChange={e => setLocalContent({ ...localContent, [`stat${num}Label`]: e.target.value })}
                      className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      placeholder="Projekter"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {block.type === 'text' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indhold</label>
            <textarea
              value={localContent.body || ''}
              onChange={e => setLocalContent({ ...localContent, body: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </>
      )}
      
      {block.type === 'cta' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (H2)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse</label>
            <textarea
              value={localContent.description || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </>
      )}

      {block.type === 'contentImage' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Layout</label>
            <select
              value={localContent.layout || 'image-left'}
              onChange={e => setLocalContent({ ...localContent, layout: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="image-left">Billede til venstre</option>
              <option value="image-right">Billede til højre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (H2)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse</label>
            <textarea
              value={localContent.description || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Knap tekst</label>
            <input
              type="text"
              value={localContent.buttonText || ''}
              onChange={e => setLocalContent({ ...localContent, buttonText: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="f.eks. Læs mere"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Knap link</label>
            <input
              type="text"
              value={localContent.buttonLink || ''}
              onChange={e => setLocalContent({ ...localContent, buttonLink: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="f.eks. /ydelser"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Billede URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localContent.image || ''}
                onChange={e => setLocalContent({ ...localContent, image: e.target.value })}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="https://..."
              />
              {onOpenMediaPicker && (
                <button
                  type="button"
                  onClick={() => handleMediaClick('image')}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
            {localContent.image && (
              <div className="mt-2 relative w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <img src={localContent.image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setLocalContent({ ...localContent, image: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {block.type === 'stats' && (
        <>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Statistikker</label>
            <button
              type="button"
              onClick={() => {
                const newStats = [
                  ...(localContent.stats || []),
                  { id: generateId('stat-new'), number: '0', label: 'Ny statistik' }
                ]
                setLocalContent({ ...localContent, stats: newStats })
              }}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              + Tilføj
            </button>
          </div>
          {(localContent.stats || []).map((stat: any, index: number) => (
            <div key={stat.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg mb-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={stat.number || ''}
                  onChange={e => {
                    const newStats = [...(localContent.stats || [])]
                    newStats[index] = { ...stat, number: e.target.value }
                    setLocalContent({ ...localContent, stats: newStats })
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Tal"
                />
                <input
                  type="text"
                  value={stat.label || ''}
                  onChange={e => {
                    const newStats = [...(localContent.stats || [])]
                    newStats[index] = { ...stat, label: e.target.value }
                    setLocalContent({ ...localContent, stats: newStats })
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Label"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newStats = (localContent.stats || []).filter((_: any, i: number) => i !== index)
                    setLocalContent({ ...localContent, stats: newStats })
                  }}
                  className="p-1.5 text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {block.type === 'gallery' && (
        <>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Galleri elementer</label>
            <button
              type="button"
              onClick={() => {
                const newItems = [
                  ...(localContent.items || []),
                  { id: generateId('gallery-new'), title: 'Nyt projekt', category: 'Hjemmeside' }
                ]
                setLocalContent({ ...localContent, items: newItems })
              }}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              + Tilføj
            </button>
          </div>
          {(localContent.items || []).map((item: any, index: number) => (
            <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg mb-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={e => {
                    const newItems = [...(localContent.items || [])]
                    newItems[index] = { ...item, title: e.target.value }
                    setLocalContent({ ...localContent, items: newItems })
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Titel"
                />
                <input
                  type="text"
                  value={item.category || ''}
                  onChange={e => {
                    const newItems = [...(localContent.items || [])]
                    newItems[index] = { ...item, category: e.target.value }
                    setLocalContent({ ...localContent, items: newItems })
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Kategori"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newItems = (localContent.items || []).filter((_: any, i: number) => i !== index)
                    setLocalContent({ ...localContent, items: newItems })
                  }}
                  className="p-1.5 text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        Gem ændringer
      </button>
    </div>
  )
}

function NavItemEditModal({ item, pages, onClose, onSave }: { item: NavItem; pages: any[]; onClose: () => void; onSave: (updates: Partial<NavItem>) => void }) {
  const [label, setLabel] = useState(item.label)
  const [href, setHref] = useState(item.href || '')
  const [pageSlug, setPageSlug] = useState(item.pageSlug || '')
  const [newTab, setNewTab] = useState(item.newTab || false)

  const handlePageChange = (slug: string) => {
    setPageSlug(slug)
    if (slug === '' || slug === 'forside') {
      setHref('/')
    } else {
      setHref(`/${slug}`)
    }
  }

  const handleSave = () => {
    onSave({
      label,
      type: 'link',
      href: href || undefined,
      pageSlug: pageSlug || undefined,
      newTab: newTab || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger navigationspunkt</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link</label>
            <input
              type="text"
              value={href}
              onChange={e => setHref(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="/min-side"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Eller vælg side</label>
            <select
              value={pageSlug}
              onChange={e => handlePageChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Vælg en side...</option>
              {pages.map(p => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editNewTab"
              checked={newTab}
              onChange={e => setNewTab(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="editNewTab" className="text-sm text-slate-700 dark:text-slate-300">Åbn i ny fane</label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

function MetaEditModal({ page, onClose, onSave }: { page: any; onClose: () => void; onSave: (meta: { title: string; description: string }) => void }) {
  const [metaTitle, setMetaTitle] = useState(page.meta?.title || '')
  const [metaDescription, setMetaDescription] = useState(page.meta?.description || '')

  const handleSave = () => {
    onSave({ title: metaTitle, description: metaDescription })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger SEO</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Titel</label>
            <input
              type="text"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder={`${page.title} | StayMain`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Beskrivelse</label>
            <textarea
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Kort beskrivelse af siden..."
            />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Google Søgning Preview</label>
            <div className="bg-white dark:bg-slate-100 rounded-lg p-4 border border-slate-200">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 truncate">
                  staymain.dk{page.slug === 'home' ? '' : `/${page.slug}`}
                </span>
                <span className="text-xl text-blue-700 hover:underline cursor-pointer truncate">
                  {metaTitle || `${page.title} | StayMain`}
                </span>
                <span className="text-sm text-slate-600 leading-snug">
                  {metaDescription || <span className="text-slate-400 italic">Ingen meta beskrivelse angivet...</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

function PageEditModal({ page, pages, onClose, onSave }: { page: { slug: string; title: string; pageSlug: string; parentSlug: string }; pages: any[]; onClose: () => void; onSave: (oldSlug: string, title: string, newSlug: string, parentSlug?: string) => void }) {
  const [title, setTitle] = useState(page.title)
  const [pageSlug, setPageSlug] = useState(page.pageSlug)
  const [parentSlug, setParentSlug] = useState(page.parentSlug)

  const handleSave = () => {
    onSave(page.slug, title, pageSlug, parentSlug || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger side</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
            <input
              type="text"
              value={pageSlug}
              onChange={e => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Overordnet side</label>
            <select
              value={parentSlug}
              onChange={e => setParentSlug(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Ingen</option>
              {pages.filter(p => p.slug !== page.slug).map(p => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

function AddNavItemModal({ pages, navigation, onClose, onSave }: { pages: any[]; navigation: NavItem[]; onClose: () => void; onSave: (item: NavItem) => void }) {
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [newTab, setNewTab] = useState(false)

  const handlePageChange = (slug: string) => {
    setPageSlug(slug)
    if (slug === '' || slug === 'forside') {
      setHref('/')
    } else {
      setHref(`/${slug}`)
    }
  }

  const handleSave = () => {
    const newItem: NavItem = {
      id: `nav-${Date.now()}`,
      label,
      type: 'link',
      href: href || undefined,
      pageSlug: pageSlug || undefined,
      newTab: newTab || undefined
    }
    onSave(newItem)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tilføj navigationspunkt</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link</label>
            <input
              type="text"
              value={href}
              onChange={e => setHref(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="/min-side"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Eller vælg side</label>
            <select
              value={pageSlug}
              onChange={e => handlePageChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Vælg en side...</option>
              {pages.map(p => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newTab"
              checked={newTab}
              onChange={e => setNewTab(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="newTab" className="text-sm text-slate-700 dark:text-slate-300">Åbn i ny fane</label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={!label}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tilføj
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onSave, onGenerate }: { onClose: () => void; onSave: (email: string, password: string) => Promise<{ success: boolean; error?: string }>; onGenerate: () => string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    const result = await onSave(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Der opstod en fejl')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Opret bruger</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="brugernavn@staymain.dk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adgangskode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <button
                onClick={() => setPassword(onGenerate())}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Generer kode"
              >
                <RefreshCw size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !email || !password}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opretter...' : 'Opret bruger'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSaveEmail, onSavePassword, onDelete, usersLength }: { user: { id: string; email: string }; onClose: () => void; onSaveEmail: (email: string) => Promise<{ success: boolean; error?: string }>; onSavePassword: (password: string) => Promise<{ success: boolean; error?: string }>; onDelete: () => Promise<{ success: boolean; error?: string }>; usersLength: number }) {
  const [email, setEmail] = useState(user.email)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    const result = await onSaveEmail(email)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Der opstod en fejl')
    }
  }

  const handleSavePassword = async () => {
    if (!newPassword) return
    setLoading(true)
    setError('')
    const result = await onSavePassword(newPassword)
    setLoading(false)
    if (result.success) {
      setNewPassword('')
    } else {
      setError(result.error || 'Der opstod en fejl')
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    const result = await onDelete()
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Der opstod en fejl')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger bruger</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Gemmer...' : 'Gem e-mail'}
            </button>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ny adgangskode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="Ny adgangskode"
              />
              <button
                onClick={handleSavePassword}
                disabled={loading || !newPassword}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Skift
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          {usersLength > 1 && (
            <button 
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              Slet bruger
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuller
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading || !email.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gemmer...' : 'Gem ændringer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreatedUserModal({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Bruger oprettet!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Kopier disse oplysninger og gem dem et sikkert sted:
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-left space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">E-mail:</p>
              <p className="font-mono text-sm text-slate-900 dark:text-white">{email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Adgangskode:</p>
              <p className="font-mono text-sm text-slate-900 dark:text-white">{password}</p>
            </div>
          </div>
          <p className="text-xs text-amber-500 mt-3">
            Denne information kan ikke vises igen!
          </p>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={onClose} 
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Forstået
          </button>
        </div>
      </div>
    </div>
  )
}

function EditCaseModal({ caseItem, onClose, onSave, onDelete }: { caseItem: Case; onClose: () => void; onSave: (updates: Partial<Case>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(caseItem.title)
  const [image, setImage] = useState(caseItem.image)
  const [link, setLink] = useState(caseItem.link || '')
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.file?.url) setImage(data.file.url)
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  const handleSave = () => {
    onSave({ title, image, link: link || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger case</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link (valgfrit)</label>
            <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Billede</label>
            {image && <img src={image} alt="Preview" className="w-full h-48 object-cover mb-2 bg-white rounded-lg p-2" />}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ImageIcon size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">Mediebibliotek</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Upload size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            Slet case
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Annuller
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              Gem ændringer
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <MediaPickerModal
          onSelect={(url) => { setImage(url); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

function EditTestimonialModal({ testimonial, onClose, onSave, onDelete }: { testimonial: Testimonial; onClose: () => void; onSave: (updates: Partial<Testimonial>) => void; onDelete: () => void }) {
  const [name, setName] = useState(testimonial.name)
  const [role, setRole] = useState(testimonial.role)
  const [content, setContent] = useState(testimonial.content)
  const [image, setImage] = useState(testimonial.image)
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.file?.url) setImage(data.file.url)
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  const handleSave = () => {
    onSave({ name, role, content, image })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger udtalelse</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Udtalelse</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Billede</label>
            {image && <img src={image} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2" />}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ImageIcon size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">Mediebibliotek</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Upload size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            Slet udtalelse
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Annuller
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              Gem ændringer
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <MediaPickerModal
          onSelect={(url) => { setImage(url); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

interface MediaFile {
  name: string
  url: string
  size: number
  type: string
  category: string
  createdAt: string
}

function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    setUploading(true)
    const newFiles: MediaFile[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.file) {
          newFiles.push(data.file)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    setFiles(prev => [...newFiles, ...prev])
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fil?')) return

    try {
      await fetch(`/api/media?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      })
      setFiles(prev => prev.filter(f => f.name !== fileName))
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredFiles = filter === 'all' 
    ? files 
    : files.filter(f => f.category === filter)
  
  const displayedFiles = search 
    ? filteredFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : filteredFiles

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return <ImageIcon size={24} />
      case 'video': return <Film size={24} />
      case 'audio': return <Music size={24} />
      case 'document': return <FileText size={24} />
      default: return <FileText size={24} />
    }
  }

  const categories = [
    { id: 'all', label: 'Alle', icon: Folder },
    { id: 'image', label: 'Billeder', icon: ImageIcon },
    { id: 'video', label: 'Videoer', icon: Film },
    { id: 'audio', label: 'Lyd', icon: Music },
    { id: 'document', label: 'Dokumenter', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Søg efter filer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span>{uploading ? 'Uploader...' : 'Upload filer'}</span>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*,audio/*,.pdf"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-slate-400" />
        </div>
      ) : displayedFiles.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Folder size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">{search ? 'Ingen filer matcher din søgning' : 'Ingen filer endnu'}</p>
          {!search && <p className="text-sm text-slate-400 mt-1">Upload billeder, videoer, lyd eller dokumenter</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="aspect-square flex items-center justify-center bg-slate-100 dark:bg-slate-700 relative">
                {file.category === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400">
                    {getFileIcon(file.category)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Kopier URL"
                  >
                    {copiedUrl === file.url ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Åbn i ny fane"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="Slet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface MediaPickerModalProps {
  onSelect: (url: string) => void
  onClose: () => void
  filter?: 'image' | 'video' | 'audio' | 'document'
}

function MediaPickerModal({ onSelect, onClose, filter: initialFilter }: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(initialFilter || 'image')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.file?.url) {
        setFiles(prev => [data.file, ...prev])
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  const filteredFiles = files.filter(f => f.category === filter || (filter === 'image' && f.type?.startsWith('image/')))

  const categories = [
    { id: 'image', label: 'Billeder', icon: ImageIcon },
    { id: 'video', label: 'Videoer', icon: Film },
    { id: 'audio', label: 'Lyd', icon: Music },
    { id: 'document', label: 'Dokumenter', icon: FileText },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mediebibliotek</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm cursor-pointer transition-colors">
              <Upload size={14} />
              {uploading ? 'Uploader...' : 'Upload'}
              <input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }} />
            </label>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
          </div>
        </div>
        
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-slate-400" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Folder size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Ingen filer i denne kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file, index) => (
                <button
                  key={`${file.name}-${index}`}
                  onClick={() => { onSelect(file.url); onClose() }}
                  className="group bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <div className="aspect-square flex items-center justify-center">
                    {file.category === 'image' ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400">
                        {file.category === 'video' && <Film size={32} />}
                        {file.category === 'audio' && <Music size={32} />}
                        {file.category === 'document' && <FileText size={32} />}
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{file.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EditLogoModal({ logo, onClose, onSave, onDelete }: { logo: CompanyLogo; onClose: () => void; onSave: (updates: Partial<CompanyLogo>) => void; onDelete: () => void }) {
  const [name, setName] = useState(logo.name)
  const [image, setImage] = useState(logo.image)
  const [website, setWebsite] = useState(logo.website || '')
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const handleSave = () => {
    onSave({ name, image, website: website || undefined })
    onClose()
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.file?.url) setImage(data.file.url)
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rediger logo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website (valgfrit)</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo</label>
            {image && <img src={image} alt="Preview" className="w-full h-24 object-contain mb-2 bg-white rounded-lg p-2" />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Folder size={18} className="mr-2 text-slate-400" />
                <span className="text-slate-500">Mediebibliotek</span>
              </button>
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
                <Upload size={18} className="mr-2 text-slate-400" />
                <span className="text-slate-500">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            Slet logo
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Annuller
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              Gem ændringer
            </button>
          </div>
        </div>
      </div>
      
      {showPicker && (
        <MediaPickerModal
          onSelect={(url) => { setImage(url); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
