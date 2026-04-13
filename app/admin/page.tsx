'use client'

import { useState, useEffect } from 'react'
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
  Users
} from 'lucide-react'
import { useCMS, CMSBlock, NavItem, Case, Testimonial, CompanyLogo } from '@/lib/cms'

const blockTypes = [
  { type: 'hero', label: 'Hero', icon: Layout, description: 'Stor header med titel og CTA' },
  { type: 'text', label: 'Tekst', icon: Type, description: 'Titel og tekstafsnit' },
  { type: 'services', label: 'Services', icon: Settings, description: 'Vis ydelser i grid' },
  { type: 'testimonials', label: 'Anmeldelser', icon: MessageSquare, description: 'Kundeudtalelser slider' },
  { type: 'stats', label: 'Statistik', icon: BarChart3, description: 'Tal og statistik' },
  { type: 'gallery', label: 'Galleri', icon: Image, description: 'Billedgalleri' },
  { type: 'cta', label: 'CTA', icon: Megaphone, description: 'Call to action sektion' },
  { type: 'contact', label: 'Kontakt', icon: FileText, description: 'Kontaktformular' },
]

function Dashboard() {
  const { pages, navigation, users, contactInfo, isAuthenticated, currentUser, supabaseReady, logout, createPage, updatePageDetails, deletePage, addBlock, removeBlock, moveBlock, updateBlockContent, updatePageMeta, moveNavItem, updateNavItem, addNavItem, removeNavItem, removeNavItemFromParent, updateNavigation, moveNavItemToParent, moveChildItem, addUser, updateUser, updateUserPassword, deleteUser, generatePassword, fetchUsers, updateContactInfo, cases, testimonials, companyLogos, addCase, updateCase, deleteCase, addTestimonial, updateTestimonial, deleteTestimonial, addCompanyLogo, updateCompanyLogo, deleteCompanyLogo } = useCMS()
  
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
  const [showComponentPicker, setShowComponentPicker] = useState(false)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingNavigation, setEditingNavigation] = useState(false)
  const [editingNavItem, setEditingNavItem] = useState<string | null>(null)
  const [navDragIndex, setNavDragIndex] = useState<number | null>(null)
  const [navDragOverIndex, setNavDragOverIndex] = useState<number | null>(null)
  const [navDragOverParent, setNavDragOverParent] = useState<string | null>(null)
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
  const [editingPageDetails, setEditingPageDetails] = useState<{ slug: string; title: string; pageSlug: string; parentSlug: string } | null>(null)
  const [showAddNavItem, setShowAddNavItem] = useState(false)
  const [newNavItemParent, setNewNavItemParent] = useState<string>('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [createdUserInfo, setCreatedUserInfo] = useState<{email: string; password: string} | null>(null)
  const [editingContactInfo, setEditingContactInfo] = useState(false)
  const [pagesCollapsed, setPagesCollapsed] = useState(true)
  const [editingCases, setEditingCases] = useState(false)
  const [editingTestimonials, setEditingTestimonials] = useState(false)
  const [editingCompanyLogos, setEditingCompanyLogos] = useState(false)
  const [editingCase, setEditingCase] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)
  const [editingLogo, setEditingLogo] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    cvr: '',
    logo: '',
    favicon: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login')
    } else {
      setIsReady(true)
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (isReady && pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0].slug)
    }
  }, [isReady, pages])

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
  }

  const handlePanelDrop = (index?: number) => {
    if (draggingFromPanel && selectedPage && draggedIndex !== null) {
      const blockType = draggedIndex === -1 ? 'text' : blockTypes[draggedIndex]?.type || 'text'
      const newBlock: CMSBlock = {
        id: `${blockType}-${Date.now()}`,
        type: blockType as CMSBlock['type'],
        content: getDefaultContent(blockType as CMSBlock['type'])
      }
      addBlock(selectedPage, newBlock, index)
    }
    setDraggingFromPanel(false)
    setDraggedIndex(null)
  }

  const getDefaultContent = (type: CMSBlock['type']): Record<string, any> => {
    switch (type) {
      case 'hero': return { title: 'Ny hero sektion', subtitle: 'Beskrivelse...' }
      case 'text': return { title: 'Ny overskrift', body: 'Tekst indhold...' }
      case 'cta': return { title: 'Klar til at komme i gang?', buttonText: 'Kontakt os' }
      default: return {}
    }
  }

  const handleSave = () => {
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
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saved 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Save size={18} className="inline mr-2" />
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
                      <button
                        onClick={() => { setSelectedPage(page.slug); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group ${indentClass} ${
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
                          {page.slug !== 'home' && page.slug !== 'ydelser' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(page.slug) }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                            >
                              <FileX size={14} />
                            </button>
                          )}
                        </div>
                      </button>
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
                Navigation
              </h2>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(true); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingNavigation
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Menu size={18} />
                <span className="text-sm font-medium">Rediger menu</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(true); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(false); setContactForm({ ...contactInfo, logo: contactInfo.logo || '', favicon: contactInfo.favicon || '' }) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingContactInfo
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Generelle oplysninger</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Indhold
              </h2>
              <button
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(true); setEditingTestimonials(false); setEditingCompanyLogos(false) }}
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
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(true); setEditingCompanyLogos(false) }}
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
                onClick={() => { setSelectedPage(null); setEditingNavigation(false); setEditingContactInfo(false); setEditingCases(false); setEditingTestimonials(false); setEditingCompanyLogos(true) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  editingCompanyLogos
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Users size={18} />
                <span className="text-sm font-medium">Firmalogoer</span>
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
                  Træk elementer for at ændre rækkefølgen. Træk et element ind i et andet for at lave en dropdown.
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
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            if (navDragIndex !== null && navDragIndex !== index) {
                              setNavDragOverIndex(index)
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (navDragIndex !== null && navDragIndex !== index) {
                              moveNavItem(navDragIndex, index)
                            }
                            setNavDragIndex(null)
                            setNavDragOverIndex(null)
                          }}
                          className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-4 transition-all ${
                            isDropTarget
                              ? 'border-blue-500 shadow-lg'
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
                                onClick={() => removeNavItem(item.id)}
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
                                      labelEn: 'New subitem',
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
                          
                          {isParentTarget && (
                            <div className="border-t-2 border-purple-500 p-3 bg-purple-50 dark:bg-purple-900/20 text-center mt-4">
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                Slip her for at lave "{item.label}" til en dropdown
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  <div
                    onDragOver={(e) => { e.preventDefault(); setNavDragOverIndex(navigation.length) }}
                    onDrop={() => {
                      if (navDragIndex !== null && navDragIndex !== navigation.length) {
                        moveNavItem(navDragIndex, navigation.length)
                      }
                      setNavDragIndex(null)
                      setNavDragOverIndex(null)
                    }}
                    className={`py-4 border-2 border-dashed rounded-xl text-center transition-colors ${
                      navDragOverIndex === navigation.length && navDragOverParent === null
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                        : 'border-slate-300 dark:border-slate-600 text-slate-500'
                    }`}
                  >
                    <p className="text-sm">
                      {navDragOverIndex === navigation.length && navDragOverParent === null
                        ? 'Slip her for at flytte til hovedmenu'
                        : 'Træk hertil for at tilføje'}
                    </p>
                  </div>
                  
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
                      onChange={e => setContactForm({ ...contactForm, companyName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={contactForm.address}
                      onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVR-nummer</label>
                    <input
                      type="text"
                      value={contactForm.cvr}
                      onChange={e => setContactForm({ ...contactForm, cvr: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo</label>
                    {contactForm.logo && <img src={contactForm.logo} alt="Logo" className="w-full h-24 object-contain mb-2 bg-white rounded-lg p-2" />}
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => setContactForm({ ...contactForm, logo: reader.result as string })
                          reader.readAsDataURL(file)
                        }
                      }} />
                      <span className="text-slate-500">Klik for at vælge logo</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Favicon</label>
                    {contactForm.favicon && <img src={contactForm.favicon} alt="Favicon" className="w-12 h-12 object-contain mb-2 bg-white rounded-lg p-1" />}
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => setContactForm({ ...contactForm, favicon: reader.result as string })
                          reader.readAsDataURL(file)
                        }
                      }} />
                      <span className="text-slate-500">Klik for at vælge favicon</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingContactInfo(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={() => {
                      updateContactInfo(contactForm)
                      setEditingContactInfo(false)
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Gem ændringer
                  </button>
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
                        titleEn: 'New case',
                        description: '',
                        descriptionEn: '',
                        image: '',
                        tags: []
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
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{caseItem.description}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setEditingCase(caseItem.id)}
                            className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Er du sikker på at du vil slette denne case?')) {
                                deleteCase(caseItem.id)
                              }
                            }}
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
                        roleEn: 'Role',
                        content: '',
                        contentEn: '',
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
                                onClick={() => {
                                  if (confirm('Er du sikker på at du vil slette denne udtalelse?')) {
                                    deleteTestimonial(testimonial.id)
                                  }
                                }}
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
                            onClick={() => {
                              if (confirm('Er du sikker på at du vil slette dette logo?')) {
                                deleteCompanyLogo(logo.id)
                              }
                            }}
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

          {currentPage && !editingNavigation && !editingContactInfo && !editingCases && !editingTestimonials && !editingCompanyLogos && (
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
                            onClick={() => removeBlock(currentPage.slug, block.id)}
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
                      onClose={() => setEditingBlock(null)}
                      onSave={(content) => {
                        if (selectedPage) {
                          updateBlockContent(selectedPage, editingBlock, content)
                          setEditingBlock(null)
                        }
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
                  onClick={() => {
                    handlePanelDragStart(blockType.type as CMSBlock['type'])
                    handlePanelDrop()
                    setShowComponentPicker(false)
                  }}
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
                Slet side?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Er du sikker på at du vil slette denne side? Denne handling kan ikke fortrydes.
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
                  deletePage(deleteConfirm)
                  if (selectedPage === deleteConfirm) {
                    setSelectedPage(pages.find(p => p.slug !== deleteConfirm)?.slug || null)
                  }
                  setDeleteConfirm(null)
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Slet side
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
          onSave={(item, parentId) => {
            addNavItem(item, parentId)
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
            if (confirm('Er du sikker på at du vil slette denne case?')) {
              deleteCase(editingCase)
              setEditingCase(null)
            }
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
            if (confirm('Er du sikker på at du vil slette denne udtalelse?')) {
              deleteTestimonial(editingTestimonial)
              setEditingTestimonial(null)
            }
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
            if (confirm('Er du sikker på at du vil slette dette logo?')) {
              deleteCompanyLogo(editingLogo)
              setEditingLogo(null)
            }
          }}
        />
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
        <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="font-semibold text-slate-900 dark:text-white">{block.content?.title}</div>
          <div className="text-sm text-blue-600 mt-1">{block.content?.buttonText}</div>
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

function BlockEditModal({ block, onClose, onSave }: { block: CMSBlock; onClose: () => void; onSave: (content: Record<string, any>) => void }) {
  const [content, setContent] = useState(block.content || {})
  const [localContent, setLocalContent] = useState(block.content || {})

  const handleSave = () => {
    onSave(localContent)
  }

  return (
    <div className="space-y-4">
      {block.type === 'hero' && (
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Undertekst</label>
            <input
              type="text"
              value={localContent.subtitle || ''}
              onChange={e => setLocalContent({ ...localContent, subtitle: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
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
            />
          </div>
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
  const [labelEn, setLabelEn] = useState(item.labelEn)
  const [type, setType] = useState<'link' | 'dropdown'>(item.type)
  const [href, setHref] = useState(item.href || '')
  const [pageSlug, setPageSlug] = useState(item.pageSlug || '')

  const handleSave = () => {
    onSave({
      label,
      labelEn,
      type,
      href: type === 'link' ? href : undefined,
      pageSlug: pageSlug || undefined
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label (Dansk)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label (Engelsk)</label>
            <input
              type="text"
              value={labelEn}
              onChange={e => setLabelEn(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'link' | 'dropdown')}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="link">Link</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
          {type === 'link' && (
            <>
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
                  onChange={e => setPageSlug(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Vælg en side...</option>
                  {pages.map(p => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}
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

function AddNavItemModal({ pages, navigation, onClose, onSave }: { pages: any[]; navigation: NavItem[]; onClose: () => void; onSave: (item: NavItem, parentId?: string) => void }) {
  const [label, setLabel] = useState('')
  const [labelEn, setLabelEn] = useState('')
  const [type, setType] = useState<'link' | 'dropdown'>('link')
  const [href, setHref] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [parentId, setParentId] = useState('')

  const handleSave = () => {
    const newItem: NavItem = {
      id: `nav-${Date.now()}`,
      label,
      labelEn,
      type,
      href: type === 'link' ? href : undefined,
      pageSlug: pageSlug || undefined
    }
    onSave(newItem, parentId || undefined)
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label (Dansk)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label (Engelsk)</label>
            <input
              type="text"
              value={labelEn}
              onChange={e => setLabelEn(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'link' | 'dropdown')}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="link">Link</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
          {type === 'link' && (
            <>
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
                  onChange={e => setPageSlug(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Vælg en side...</option>
                  {pages.map(p => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent (valgfrit)</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Ingen (hovedmenu)</option>
              {navigation.filter(n => n.type === 'dropdown').map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
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
              onClick={handleDelete} 
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
  const [titleEn, setTitleEn] = useState(caseItem.titleEn)
  const [description, setDescription] = useState(caseItem.description)
  const [descriptionEn, setDescriptionEn] = useState(caseItem.descriptionEn)
  const [image, setImage] = useState(caseItem.image)
  const [link, setLink] = useState(caseItem.link || '')
  const [tags, setTags] = useState(caseItem.tags.join(', '))

  const handleSave = () => {
    onSave({
      title,
      titleEn,
      description,
      descriptionEn,
      image,
      link: link || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (Dansk)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (Engelsk)</label>
            <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse (Dansk)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beskrivelse (Engelsk)</label>
            <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link (valgfrit)</label>
            <input type="text" value={link} onChange={e => setLink(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (kommasepareret)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Web, Design, Branding" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Billede</label>
            {image && <img src={image} alt="Preview" className="w-full h-48 object-cover mb-2 bg-white rounded-lg p-2" />}
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <input type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImage(reader.result as string)
                  reader.readAsDataURL(file)
                }
              }} />
              <span className="text-slate-500">Klik for at vælge billede</span>
            </label>
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
    </div>
  )
}

function EditTestimonialModal({ testimonial, onClose, onSave, onDelete }: { testimonial: Testimonial; onClose: () => void; onSave: (updates: Partial<Testimonial>) => void; onDelete: () => void }) {
  const [name, setName] = useState(testimonial.name)
  const [role, setRole] = useState(testimonial.role)
  const [roleEn, setRoleEn] = useState(testimonial.roleEn)
  const [content, setContent] = useState(testimonial.content)
  const [contentEn, setContentEn] = useState(testimonial.contentEn)
  const [image, setImage] = useState(testimonial.image)

  const handleSave = () => {
    onSave({ name, role, roleEn, content, contentEn, image })
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (Dansk)</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titel (Engelsk)</label>
            <input type="text" value={roleEn} onChange={e => setRoleEn(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Udtalelse (Dansk)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Udtalelse (Engelsk)</label>
            <textarea value={contentEn} onChange={e => setContentEn(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Billede</label>
            {image && <img src={image} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2" />}
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <input type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImage(reader.result as string)
                  reader.readAsDataURL(file)
                }
              }} />
              <span className="text-slate-500">Klik for at vælge billede</span>
            </label>
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
    </div>
  )
}

function EditLogoModal({ logo, onClose, onSave, onDelete }: { logo: CompanyLogo; onClose: () => void; onSave: (updates: Partial<CompanyLogo>) => void; onDelete: () => void }) {
  const [name, setName] = useState(logo.name)
  const [image, setImage] = useState(logo.image)
  const [website, setWebsite] = useState(logo.website || '')

  const handleSave = () => {
    onSave({ name, image, website: website || undefined })
    onClose()
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
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <input type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImage(reader.result as string)
                  reader.readAsDataURL(file)
                }
              }} />
              <span className="text-slate-500">Klik for at vælge logo</span>
            </label>
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
    </div>
  )
}

export default Dashboard
