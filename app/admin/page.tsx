'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  Headphones,
  TriangleAlert,
  PanelTop,
  Monitor
} from 'lucide-react'
import { useCMS, CMSBlock, NavItem, Case, Testimonial, CompanyLogo } from '@/lib/cms'
import { uploadImage, authHeaders } from '@/lib/supabase'
import {
  DndContext,
  closestCenter,
  pointerWithin,
  type Active,
  type Over,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useDndSensors } from './dnd'
import {
  ADMIN_SECTIONS,
  DEFAULT_SECTION,
  sectionHref,
  type AdminSection,
} from './sections'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  SortableBlockRow,
  BlockSortableList,
  ListEndZone,
  disarmRowClick,
} from './dnd-items'
import {
  SortableNavList,
  flattenNav,
  navPathOf,
  navRowId,
  resolveNavDrop,
  rebuildNavTree,
} from './nav-list'
import {
  Button,
  IconButton,
  Panel,
  PanelHeader,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
  Modal,
  SlideOver,
  EmptyState,
  ErrorNote,
  AddRowButton,
  Badge,
  SectionShell,
  cx,
} from './ui'
import { PagePreview } from './page-preview'

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

type FooterLink = {
  id: string
  label: string
  href: string
}


/**
 * Logo / favicon picker. Both were near-identical duplicated blocks, and the
 * old markup stacked icon + label inside a `gap-2` flex row while also keeping
 * the old `mr-2` margin, so the icons were double-spaced.
 */
function AssetField({
  id,
  label,
  hint,
  value,
  previewClass,
  uploading,
  onOpenLibrary,
  onUpload,
  onClear,
}: {
  id: string
  label: string
  hint?: string
  value?: string
  previewClass: string
  uploading: boolean
  onOpenLibrary: () => void
  onUpload: (file: File) => Promise<void>
  onClear: () => void
}) {
  return (
    <Panel className="flex flex-col p-4">
      <label htmlFor={id} className="text-[13px] font-medium leading-none text-[var(--ink-2)]">
        {label}
      </label>

      <div className="mt-3 flex min-h-[80px] items-center justify-center rounded-md border border-[var(--hairline)] bg-[var(--surface-sunken)] p-2">
        {value ? (
          <img src={value} alt={label} className={`${previewClass} object-contain`} />
        ) : (
          <span className="text-[13px] text-[var(--ink-3)]">Ingen valgt</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onOpenLibrary}>
          <Folder size={15} />
          Bibliotek
        </Button>
        <label
          htmlFor={id}
          className="inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--hairline-strong)] px-2.5 text-xs font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (file) await onUpload(file)
              // Reset so re-picking the same file fires change again.
              e.target.value = ''
            }}
          />
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploadér
            </>
          ) : (
            <>
              <Upload size={14} />
              Upload
            </>
          )}
        </label>
      </div>

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 self-start text-[13px] font-medium text-[var(--danger)] transition-opacity hover:opacity-75"
        >
          Fjern {label.toLowerCase()}
        </button>
      )}

      {hint && <p className="mt-2 text-xs leading-snug text-[var(--ink-3)]">{hint}</p>}
    </Panel>
  )
}

function RailGroup({ label, children }: { label: string; children: React.ReactNode }) {  return (
    <div>
      <p className="admin-eyebrow px-2 pb-1.5">{label}</p>
      <div className="space-y-px">{children}</div>
    </div>
  )
}

function RailItem({
  icon,
  label,
  active,
  onClick,
  count,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'text-[var(--ink-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]'
      }`}
    >
      <span className="shrink-0 text-[var(--ink-3)]">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="admin-num shrink-0 text-[10px] text-[var(--ink-3)]">{count}</span>
      )}
    </button>
  )
}

/**
 * Save control that reports state rather than relying on colour alone, and
 * never sits in a permanently disabled state that looks clickable.
 */
function SaveButton({
  saved,
  dirty,
  onSave,
}: {
  saved: boolean
  dirty: boolean
  onSave: () => void
}) {
  const idle = !saved && !dirty
  return (
    <div className="flex items-center gap-2">
      <span
        aria-live="polite"
        className={`hidden text-[13px] sm:inline ${dirty ? 'text-[var(--ink-2)]' : 'text-transparent'}`}
      >
        {dirty ? 'Ikke gemt' : 'placeholder'}
      </span>
      <Button
        onClick={onSave}
        variant={dirty || saved ? 'primary' : 'secondary'}
        disabled={idle}
        size="sm"
      >
        <Save size={15} />
        {saved ? 'Gemt' : 'Gem ændringer'}
      </Button>
    </div>
  )
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

/**
 * Outcome of a menu drag: a legal landing gap, an explicitly refused one, or
 * nothing to report. Distinguishing "blocked" from "none" is what lets the row
 * show that a drop is not allowed instead of silently doing nothing.
 */
type NavDropPlan =
  | { kind: 'move'; path: string; side: 'top' | 'bottom'; depth: number }
  | { kind: 'blocked'; path: string; side: 'top' | 'bottom' }
  | { kind: 'none' }

export type { NavDropPlan }

const NO_DROP: NavDropPlan = { kind: 'none' }

/**
 * Which gap a dragged row is aiming at, from indices alone.
 *
 * The block editor already works this way, and it is why its line stays put.
 * Reading the pointer's position inside the hovered row looks more direct, but
 * the sorting strategy is translating rows to open the gap, so both rows move
 * while you compare them and the answer oscillates near a row's midpoint.
 * Direction of travel is stable: up means the gap above, down means the gap below.
 */
function resolveReorderSide(fromIndex: number, overIndex: number): 'top' | 'bottom' {
  return fromIndex > overIndex ? 'top' : 'bottom'
}

interface BlockDropTarget {
  /** Index being dragged away from. */
  from: number
  /** Index the block should end up at. */
  to: number
  /** Which edge of the hovered row shows the insertion line. */
  side: 'top' | 'bottom'
}

/**
 * Single source of truth for both the insertion line and the mutation that runs
 * on drop. Previously the highlight and the resulting order were computed
 * separately, which is how a block could land somewhere other than where the
 * line was drawn.
 *
 * The gap comes from which way the block is travelling, not from which half of
 * the row the pointer is over: the hovered row is itself being displaced, and
 * this is also exactly what the final splice will do.
 */
function resolveBlockDrop(active: Active, over: Over, blocks: CMSBlock[]): BlockDropTarget | null {
  if (over.id === 'list-end') {
    const from = blocks.findIndex(b => b.id === active.id)
    if (from === -1 || from === blocks.length - 1) return null
    return { from, to: blocks.length, side: 'bottom' }
  }
  const overIndex = blocks.findIndex(b => b.id === over.id)
  if (overIndex === -1) return null

  const from = blocks.findIndex(b => b.id === active.id)
  if (from === -1 || from === overIndex) return null
  return from > overIndex
    ? { from, to: overIndex, side: 'top' }
    : { from, to: overIndex, side: 'bottom' }
}

/**
 * Icons for the rail, keyed by section.
 *
 * The section list itself lives in ./sections, which the server route imports to
 * validate the URL. Icons stay here because they are only ever rendered by the
 * client, and pulling them into a shared module would drag the client boundary
 * with them.
 */
const SECTION_ICONS: Record<AdminSection, React.ReactNode> = {
  sider: <FileText size={15} />,
  generelt: <Settings size={15} />,
  'header-footer': <PanelTop size={15} />,
  cases: <Briefcase size={15} />,
  anmeldelser: <Quote size={15} />,
  logoer: <Users size={15} />,
  mediebibliotek: <Folder size={15} />,
  menu: <Menu size={15} />,
}

/**
 * The admin shell, shared by every route.
 *
 * Rendered by `/admin/[section]` and by `/admin/sider/[...slug]`, so every
 * screen has a URL that can be linked to and so Back works. The props say which
 * screen to show; the component no longer decides that for itself.
 */
export function AdminWorkspace({
  initialSlug,
  initialView = DEFAULT_SECTION,
  startCreatingPage,
}: {
  /** Page being edited. Present on /admin/sider/[...slug]. */
  initialSlug?: string
  /** Section being shown. Present on /admin/[section]. */
  initialView?: AdminSection
  /** Opens the create-page dialog on arrival, for the /admin/sider/ny route. */
  startCreatingPage?: boolean
} = {}) {
  const { pages, navigation, users, contactInfo, isAuthenticated, currentUser, supabaseReady, logout, createPage, updatePageDetails, deletePage, addBlock, removeBlock, moveBlock, updateBlockContent, updatePageMeta, updateNavItem, addNavItem, removeNavItem, updateNavigation, moveNavItemToParent, convertToDropdown, setNavLayout, orderingPersisted, addUser, updateUser, updateUserPassword, deleteUser, generatePassword, fetchUsers, updateContactInfo, cases, testimonials, companyLogos, addCase, updateCase, deleteCase, addTestimonial, updateTestimonial, deleteTestimonial, addCompanyLogo, updateCompanyLogo, deleteCompanyLogo } = useCMS()
  
  useEffect(() => {
    if (supabaseReady && users.length === 0) {
      fetchUsers()
    }
  }, [supabaseReady])
  
  const router = useRouter()
  const [selectedPage, setSelectedPage] = useState<string | null>(initialSlug ?? null)
  const [blockDrop, setBlockDrop] = useState<{ overId: string; side: 'top' | 'bottom' } | null>(null)
  const [showComponentPicker, setShowComponentPicker] = useState(false)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [previewRevision, setPreviewRevision] = useState(0)
  const blockEditRef = useRef<((fieldKey: string | null, url?: string) => void) | null>(null)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingNavItem, setEditingNavItem] = useState<string | null>(null)
  /** Outcome of the drag in progress, used to drive the row indicator. */
  const [navDrop, setNavDrop] = useState<NavDropPlan>(NO_DROP)
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
  const [editingCase, setEditingCase] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)
  const [editingLogo, setEditingLogo] = useState<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'favicon' | 'image' | 'video'>('logo')
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{filter: string, fieldKey: string, blockId: string | null} | null>(null)
  const [selectingMetaImage, setSelectingMetaImage] = useState(false)

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
        headers: await authHeaders(),
        body: formData,
      })
      const data = await res.json()
      // Without res.ok a 400/500 was indistinguishable from success, so
      // rejected uploads silently did nothing.
      if (!res.ok) {
        alert(data.error || 'Uploaden mislykkedes')
        return null
      }
      return data.file?.url || null
    } catch (error) {
      console.error('Upload error:', error)
      alert('Uploaden mislykkedes')
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
    // Wait for the session check to finish before deciding. `isAuthenticated` is
    // derived from the signed-in user, so it reads false during the very first
    // render of a hard load. Redirecting then bounced a signed-in visitor to
    // /admin/login, which pushed straight back to /admin and quietly discarded
    // whichever route they actually asked for.
    if (!supabaseReady) return
    if (!isAuthenticated) {
      router.push('/admin/login')
    } else {
      setIsReady(true)
    }
  }, [supabaseReady, isAuthenticated, router])

  // Derived above the auth gate because the hook below depends on it, and no
  // hook may sit after an early return.
  const currentPage = pages.find(p => p.slug === selectedPage)

  // Bumped whenever the saved blocks change, so the preview iframe reloads and
  // shows the committed result rather than a stale document.
  useEffect(() => {
    if (!isAuthenticated || !isReady) return
    setPreviewRevision(r => r + 1)
  }, [currentPage?.blocks, isAuthenticated, isReady])

  // Sensors are hooks, so they have to be created before the auth gate below.
  // Declaring them after it made the hook count depend on authentication, which
  // React reported as "Rendered more hooks than during the previous render".
  const navSensors = useDndSensors()
  const blockSensors = useDndSensors()
  const [navActiveId, setNavActiveId] = useState<string | null>(null)
  // A hook, so it has to sit above the auth gate with the rest of them. Placing
  // it after made the hook count depend on authentication, which React reports
  // as "Rendered more hooks than during the previous render".
  //
  // WordPress renders the menu as one flat indented list, so that is what the
  // drag maths operates on: vertical position picks the row, horizontal offset
  // picks the level.
  const flatNav = useMemo(() => flattenNav(navigation), [navigation])

  // The route owns which page is open, so navigating between them has to
  // follow. A hook, so it sits with the rest above the auth gate.
  useEffect(() => {
    setSelectedPage(initialSlug ?? null)
    setEditingBlock(null)
    setEditingNavItem(null)
  }, [initialSlug])

  const createRequested = useRef(false)
  useEffect(() => {
    if (!startCreatingPage || createRequested.current) return
    createRequested.current = true
    setShowCreatePage(true)
  }, [startCreatingPage])

  const [view, setView] = useState<AdminSection>(initialView)
  // The route owns which screen is shown, so client navigation has to follow.
  useEffect(() => {
    setView(initialView)
  }, [initialView])

  /** Section in view, plus a page editor when one is open. */
  const activeView = initialSlug ? 'page' : view

  if (!isAuthenticated || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-hover)] bg-[var(--surface-sunken)]">
        <div className="animate-pulse text-[var(--ink-2)]">Indlæser...</div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  /** Moving between sections is a navigation, so each one gets a URL. */
  const goTo = (next: AdminSection) => {
    setEditingNavItem(null)
    setEditingBlock(null)
    // Both contact screens edit the same record, so each arrival reloads the
    // form rather than showing a stale copy left over from the other screen.
    if (next === 'generelt' || next === 'header-footer') {
      setContactForm({
        ...contactInfo,
        logo: contactInfo.logo || '',
        favicon: contactInfo.favicon || '',
        headerButtonText: contactInfo.headerButtonText || '',
        footerDescription: contactInfo.footerDescription || '',
        footerCol2Title: contactInfo.footerCol2Title || '',
        footerCol3Title: contactInfo.footerCol3Title || '',
        footerCol4Title: contactInfo.footerCol4Title || '',
        footerCol2Links: contactInfo.footerCol2Links || [],
        footerCol3Links: contactInfo.footerCol3Links || [],
        footerCol4Links: contactInfo.footerCol4Links || [],
      })
    }
    router.push(sectionHref(next))
  }

  /**
   * Flat list of menu rows, recomputed whenever the tree changes.
   *
   * WordPress renders the menu as a single indented list rather than a tree of
   * nested panels, so that is what the drag maths operates on: vertical
   * position picks the row, horizontal offset picks the depth.
   */
  /**
   * Where a drag would land, or why it cannot.
   *
   * A parent's children sit directly beneath it, so a drag that travels over
   * its own branch passes gaps that cannot be drop points. Reporting those as
   * refusals turned most of the journey red and made the list feel broken, so
   * they are skipped instead: the last legal indicator simply stays where it
   * was, and the row only settles once the pointer reaches a real gap.
   */
  const planNavMove = (activeId: string, overId: string): NavDropPlan => {
    const fromIndex = flatNav.findIndex(r => r.path === navPathOf(activeId))
    const overIndex = flatNav.findIndex(r => r.path === navPathOf(overId))
    if (fromIndex === -1 || overIndex === -1 || fromIndex === overIndex) {
      return { kind: 'none' }
    }

    // The dragged row travels with everything under it, so a gap inside that
    // block is the block's own interior rather than a candidate position.
    const movingPath = flatNav[fromIndex].path
    if (navPathOf(overId).startsWith(`${movingPath}.`)) return { kind: 'none' }

    const side = resolveReorderSide(fromIndex, overIndex)
    const result = resolveNavDrop({
      flat: flatNav,
      fromIndex,
      insertAt: side === 'top' ? overIndex : overIndex + 1,
    })
    if (!result) return { kind: 'blocked', path: navPathOf(overId), side }

    return { kind: 'move', path: navPathOf(overId), side, depth: result.depth }
  }

  const handleNavDragOver = (event: DragOverEvent) => {
    const over = event.over
    setNavDrop(over ? planNavMove(String(event.active.id), String(over.id)) : { kind: 'none' })
  }

  const handleNavDragEnd = (event: DragEndEvent) => {
    setNavDrop({ kind: 'none' })
    setNavActiveId(null)
    const over = event.over
    if (!over) return

    const fromIndex = flatNav.findIndex(r => r.path === navPathOf(String(event.active.id)))
    const overIndex = flatNav.findIndex(r => r.path === navPathOf(String(over.id)))
    if (fromIndex === -1 || overIndex === -1 || fromIndex === overIndex) return

    const result = resolveNavDrop({
      flat: flatNav,
      fromIndex,
      insertAt: resolveReorderSide(fromIndex, overIndex) === 'top' ? overIndex : overIndex + 1,
    })
    if (!result) return

    setNavLayout(rebuildNavTree(result.placements))
  }



  const handleBlockDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !currentPage) {
      setBlockDrop(null)
      return
    }
    const target = resolveBlockDrop(active, over, currentPage.blocks)
    setBlockDrop(target ? { overId: String(over.id), side: target.side } : null)
  }

  const handleBlockDragEnd = ({ active, over }: DragEndEvent) => {
    // Any press that is currently armed was a drag, not a click.
    disarmRowClick()
    setBlockDrop(null)
    if (!over || !selectedPage || !currentPage) return

    const target = resolveBlockDrop(active, over, currentPage.blocks)
    if (!target) return

    moveBlock(selectedPage, target.from, target.to)
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
    // Both settings screens edit the same contact record, so the save button
    // acts on whichever one is showing rather than on a stored flag.
    if (view === 'generelt' || view === 'header-footer') {
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

  const openPage = (slug: string) =>
    router.push(`/admin/sider/${slug.split('/').map(encodeURIComponent).join('/')}`)

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-[var(--surface)]">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              title="Tilbage til sitet"
              aria-label="Tilbage til sitet"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-baseline gap-2.5">
              <span className="text-sm font-semibold tracking-tight">StayMain</span>
              <span className="admin-eyebrow">CMS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSupport(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
            >
              <Headphones size={15} />
              <span className="hidden sm:inline">Support</span>
            </button>

            {currentUser && (
              <div
                className="hidden items-center gap-2 rounded-md border border-[var(--hairline)] px-2 py-1 md:flex"
                title={currentUser.email}
              >
                <span className="admin-num flex h-5 w-5 items-center justify-center rounded bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[130px] truncate text-[13px] text-[var(--ink-2)]">
                  {currentUser.email}
                </span>
              </div>
            )}

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              title="Log ud"
            >
              <LogOut size={15} />
            </Button>

            <SaveButton
              saved={saved}
              dirty={hasUnsavedChanges}
              onSave={handleSave}
            />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-[13rem] shrink-0 flex-col overflow-y-auto border-r border-[var(--hairline)] bg-[var(--surface)] lg:flex">
          <div className="flex-1 space-y-6 px-3 py-4">
            <RailGroup label="Indhold">
              <RailItem
                icon={<FileText size={15} />}
                label="Sider"
                active={activeView === 'page'}
                onClick={() => router.push('/admin/sider')}
                count={pages.length}
              />
              {/* Driven from the shared registry so a section can never appear
                  in the rail without a URL, or the other way round. */}
              {(Object.keys(ADMIN_SECTIONS) as AdminSection[])
                .filter(s => s !== 'sider')
                .map(s => (
                  <RailItem
                    key={s}
                    icon={SECTION_ICONS[s]}
                    label={ADMIN_SECTIONS[s].label}
                    active={view === s}
                    onClick={() => goTo(s)}
                    count={
                      s === 'cases' ? cases.length
                      : s === 'anmeldelser' ? testimonials.length
                      : s === 'logoer' ? companyLogos.length
                      : undefined
                    }
                  />
                ))}
            </RailGroup>

            <RailGroup label="Brugere">
              <RailItem
                icon={<Plus size={15} />}
                label="Opret bruger"
                onClick={() => setShowCreateUser(true)}
              />
              {users.map(user => (
                <RailItem
                  key={user.id}
                  icon={
                    <span className="admin-num flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[var(--surface-hover)] text-[9px] font-semibold text-[var(--ink-2)]">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  }
                  label={user.email}
                  onClick={() => setEditingUser(user.id)}
                />
              ))}
            </RailGroup>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {view === 'menu' && (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--surface)] px-6 py-3.5">
                <div>
                  <p className="admin-eyebrow mb-1">Navigation</p>
                  <h2 className="text-[15px] font-semibold leading-tight text-[var(--ink)]">
                    Hovedmenu
                  </h2>
                </div>
                <p className="max-w-xs text-right text-[13px] leading-snug text-[var(--ink-3)]">
                  Træk på grebet for at ændre rækkefølgen. Klik på
                  &quot;+ Dropdown&quot; for at give et punkt underpunkter.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {!orderingPersisted && (
                  <p
                    className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] leading-snug text-[var(--ink-2)]"
                    role="status"
                  >
                    <strong className="font-medium text-[var(--danger)]">
                      Rækkefølgen gemmes ikke.
                    </strong>{' '}
                    En ny rækkefølge virker, men forsvinder ved genindlæsning, fordi
                    database-tabellerne mangler kolonnen <code>position</code>. Kør{' '}
                    <code className="font-medium">supabase/migrations/001_add_position_columns.sql</code>{' '}
                    i Supabase SQL Editor.
                  </p>
                )}
                <div className="mx-auto max-w-2xl space-y-2">
                  {navigation.length === 0 && (
                    <EmptyState
                      icon={<Menu size={22} />}
                      title="Ingen navigationspunkter endnu"
                      description="Menuen vises i toppen af det offentlige site."
                      action={
                        <Button variant="secondary" onClick={() => setShowAddNavItem(true)}>
                          <Plus size={15} />
                          Tilføj punkt
                        </Button>
                      }
                    />
                  )}
                  
                  <DndContext
                    sensors={navSensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setNavActiveId(navPathOf(String(active.id)))}
                    onDragOver={handleNavDragOver}
                    onDragEnd={handleNavDragEnd}
                    onDragCancel={() => {
                      setNavDrop(NO_DROP)
                      setNavActiveId(null)
                    }}
                  >
                    <SortableContext
                      items={flatNav.map(r => navRowId(r.path))}
                      strategy={verticalListSortingStrategy}
                    >
                      <SortableNavList
                        flat={flatNav}
                        drop={navDrop}
                        draggedPath={navActiveId}
                        onOpen={setEditingNavItem}
                        onDelete={item => {
                          setDeleteConfirm(item.id)
                          setDeleteConfirmType('nav')
                        }}
                        onAddChild={parentId =>
                          addNavItem(
                            {
                              id: generateId('nav'),
                              label: 'Nyt underpunkt',
                              type: 'link',
                              href: '/ny-side',
                            },
                            parentId
                          )
                        }
                        onPromote={id => moveNavItemToParent(id)}
                        onMakeDropdown={item =>
                          // Turns the link into a dropdown and adds a first
                          // sub-item, so it is immediately usable and visible.
                          convertToDropdown(item.id, generateId('nav'))
                        }
                      />
                    </SortableContext>
                  </DndContext>
                  
                  <button
                    onClick={() => setShowAddNavItem(true)}
                    className="w-full py-4 border-2 border-dashed border-[var(--hairline-strong)] rounded-lg text-[var(--ink-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Tilføj navigationspunkt
                  </button>
                </div>
              </div>
            </>
          )}


          {view === 'generelt' && (
            <SectionShell eyebrow="Indhold" title="Generelle oplysninger" width="max-w-2xl">
              <div className="space-y-4">
                <Panel className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Virksomhedsnavn" htmlFor="cf-company">
                      <Input
                        id="cf-company"
                        value={contactForm.companyName}
                        onChange={e => updateContactForm({ companyName: e.target.value })}
                      />
                    </Field>

                    <Field label="E-mail" htmlFor="cf-email">
                      <Input
                        id="cf-email"
                        type="email"
                        value={contactForm.email}
                        onChange={e => updateContactForm({ email: e.target.value })}
                      />
                    </Field>

                    <Field label="Telefon" htmlFor="cf-phone">
                      <Input
                        id="cf-phone"
                        type="tel"
                        value={contactForm.phone}
                        onChange={e => updateContactForm({ phone: e.target.value })}
                      />
                    </Field>

                    <Field label="CVR-nummer" htmlFor="cf-cvr">
                      <Input
                        id="cf-cvr"
                        value={contactForm.cvr}
                        onChange={e => updateContactForm({ cvr: e.target.value })}
                      />
                    </Field>

                    <Field label="Adresse" htmlFor="cf-address" className="sm:col-span-2">
                      <Input
                        id="cf-address"
                        value={contactForm.address}
                        onChange={e => updateContactForm({ address: e.target.value })}
                      />
                    </Field>
                  </div>
                </Panel>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AssetField
                    id="cf-logo"
                    label="Logo"
                    hint="Vises i footeren. Anbefalet: gennemsigtig PNG."
                    value={contactForm.logo}
                    previewClass="h-20"
                    uploading={uploadingLogo}
                    onOpenLibrary={handleOpenLogoPicker}
                    onUpload={async file => {
                      setUploadingLogo(true)
                      const url = await uploadToMediaLibrary(file)
                      if (url) updateContactForm({ logo: url })
                      setUploadingLogo(false)
                    }}
                    onClear={() => updateContactForm({ logo: '' })}
                  />

                  <AssetField
                    id="cf-favicon"
                    label="Favicon"
                    hint="Vises i browserens fanne. 32×32 px eller større."
                    value={contactForm.favicon}
                    previewClass="h-12 w-12"
                    uploading={uploadingFavicon}
                    onOpenLibrary={handleOpenFaviconPicker}
                    onUpload={async file => {
                      setUploadingFavicon(true)
                      const url = await uploadToMediaLibrary(file)
                      if (url) updateContactForm({ favicon: url })
                      setUploadingFavicon(false)
                    }}
                    onClear={() => updateContactForm({ favicon: '' })}
                  />
                </div>
              </div>
            </SectionShell>
          )}

          {view === 'header-footer' && (
            <SectionShell eyebrow="Indhold" title="Header / Footer" width="max-w-2xl">
              <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-5">
                <div className="space-y-6">
                  <div>
                    <h3 className="admin-eyebrow border-b border-[var(--hairline)] pb-2">Header</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Knap tekst</label>
                        <input
                          type="text"
                          value={contactForm.headerButtonText}
                          onChange={e => updateContactForm({ headerButtonText: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="admin-eyebrow border-b border-[var(--hairline)] pb-2">Footer</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Beskrivelse</label>
                        <input
                          type="text"
                          value={contactForm.footerDescription}
                          onChange={e => updateContactForm({ footerDescription: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium leading-none text-[var(--ink-2)]">Kolonne 2 (Navigation)</h4>
                    <div className="space-y-3 border-l-2 border-[var(--hairline)] pl-4">
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol2Title}
                          onChange={e => updateContactForm({ footerCol2Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
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
                                  className="admin-input px-2 py-1.5 text-sm"
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
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol2Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol2Links: newLinks })
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
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
                            className="text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium leading-none text-[var(--ink-2)]">Kolonne 3 (Services)</h4>
                    <div className="space-y-3 border-l-2 border-[var(--hairline)] pl-4">
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol3Title}
                          onChange={e => updateContactForm({ footerCol3Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
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
                                  className="admin-input px-2 py-1.5 text-sm"
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
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol3Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol3Links: newLinks })
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
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
                            className="text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium leading-none text-[var(--ink-2)]">Kolonne 4</h4>
                    <div className="space-y-3 border-l-2 border-[var(--hairline)] pl-4">
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overskrift</label>
                        <input
                          type="text"
                          value={contactForm.footerCol4Title}
                          onChange={e => updateContactForm({ footerCol4Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
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
                                  className="admin-input px-2 py-1.5 text-sm"
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
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactForm.footerCol4Links || []).filter((_, i) => i !== index)
                                  updateContactForm({ footerCol4Links: newLinks })
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
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
                            className="text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
                          >
                            + Tilføj link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionShell>
          )}

          {view === 'cases' && (
            <SectionShell
              eyebrow="Indhold"
              title="Cases"
              meta={
                <span className="admin-num text-[11px] text-[var(--ink-3)]">{cases.length}</span>
              }
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const newCase: Case = { id: generateId('case'), title: 'Ny case', image: '' }
                    addCase(newCase)
                    setEditingCase(newCase.id)
                  }}
                >
                  <Plus size={15} />
                  Tilføj case
                </Button>
              }
            >
              {cases.length === 0 ? (
                <EmptyState
                  icon={<Briefcase size={22} />}
                  title="Ingen cases endnu"
                  description="Cases vises på forsiden og på jeres ydelsessider."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const newCase: Case = { id: generateId('case'), title: 'Ny case', image: '' }
                        addCase(newCase)
                        setEditingCase(newCase.id)
                      }}
                    >
                      <Plus size={15} />
                      Tilføj den første case
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cases.map(caseItem => (
                    <div
                      key={caseItem.id}
                      className="group overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface)] transition-colors hover:border-[var(--hairline-strong)]"
                    >
                      {caseItem.image ? (
                        <img
                          src={caseItem.image}
                          alt={caseItem.title}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-[var(--surface-sunken)] text-[var(--ink-3)]">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                        <h3 className="truncate text-[13px] font-medium text-[var(--ink)]">
                          {caseItem.title}
                        </h3>
                        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <IconButton
                            label={`Rediger ${caseItem.title}`}
                            onClick={() => setEditingCase(caseItem.id)}
                          >
                            <Settings size={15} />
                          </IconButton>
                          <IconButton
                            label={`Slet ${caseItem.title}`}
                            className="hover:text-[var(--danger)]"
                            onClick={() => {
                              setDeleteConfirm(caseItem.id)
                              setDeleteConfirmType('case')
                            }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>
          )}

          {view === 'anmeldelser' && (
            <SectionShell
              eyebrow="Indhold"
              title="Kundeudtalelser"
              meta={
                <span className="admin-num text-[11px] text-[var(--ink-3)]">
                  {testimonials.length}
                </span>
              }
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const newTestimonial: Testimonial = {
                      id: generateId('testimonial'),
                      name: 'Ny kunde',
                      role: 'Titel',
                      content: '',
                      image: '',
                    }
                    addTestimonial(newTestimonial)
                    setEditingTestimonial(newTestimonial.id)
                  }}
                >
                  <Plus size={15} />
                  Tilføj udtalelse
                </Button>
              }
            >
              {testimonials.length === 0 ? (
                <EmptyState
                  icon={<Quote size={22} />}
                  title="Ingen kundeudtalelser endnu"
                  description="Udtalelser styrker tilliden til jeres arbejde. Tilføj gerne en til."
                />
              ) : (
                <div className="space-y-2">
                  {testimonials.map(testimonial => (
                    <div
                      key={testimonial.id}
                      className="group flex gap-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--hairline-strong)]"
                    >
                      {testimonial.image ? (
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="admin-num flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[13px] font-semibold text-[var(--ink-2)]">
                          {testimonial.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-medium text-[var(--ink)]">
                              {testimonial.name}
                            </h3>
                            {testimonial.role && (
                              <p className="text-xs text-[var(--ink-3)]">{testimonial.role}</p>
                            )}
                          </div>
                          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                            <IconButton
                              label={`Rediger ${testimonial.name}`}
                              onClick={() => setEditingTestimonial(testimonial.id)}
                            >
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton
                              label={`Slet ${testimonial.name}`}
                              className="hover:text-[var(--danger)]"
                              onClick={() => {
                                setDeleteConfirm(testimonial.id)
                                setDeleteConfirmType('testimonial')
                              }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </span>
                        </div>
                        {testimonial.content && (
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--ink-2)]">
                            {testimonial.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>
          )}

          {view === 'logoer' && (
            <SectionShell
              eyebrow="Indhold"
              title="Firmalogoer"
              meta={
                <span className="admin-num text-[11px] text-[var(--ink-3)]">
                  {companyLogos.length}
                </span>
              }
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const newLogo: CompanyLogo = { id: generateId('logo'), name: 'Nyt logo', image: '' }
                    addCompanyLogo(newLogo)
                    setEditingLogo(newLogo.id)
                  }}
                >
                  <Plus size={15} />
                  Tilføj logo
                </Button>
              }
            >
              {companyLogos.length === 0 ? (
                <EmptyState
                  icon={<Users size={22} />}
                  title="Ingen firmalogoer endnu"
                  description="Logos vises i footeren som jeres kundeliste."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {companyLogos.map(logo => (
                    <div
                      key={logo.id}
                      className="group relative rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--hairline-strong)]"
                    >
                      <div className="flex h-16 items-center justify-center rounded bg-[var(--surface-sunken)]">
                        {logo.image ? (
                          <img src={logo.image} alt={logo.name} className="max-h-14 w-full object-contain" />
                        ) : (
                          <ImageIcon size={18} className="text-[var(--ink-3)]" />
                        )}
                      </div>
                      <p className="mt-2 truncate text-center text-xs text-[var(--ink-2)]">{logo.name}</p>
                      <span className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <IconButton
                          label={`Rediger ${logo.name}`}
                          className="h-6 w-6"
                          onClick={() => setEditingLogo(logo.id)}
                        >
                          <Pencil size={13} />
                        </IconButton>
                        <IconButton
                          label={`Slet ${logo.name}`}
                          className="h-6 w-6 hover:text-[var(--danger)]"
                          onClick={() => {
                            setDeleteConfirm(logo.id)
                            setDeleteConfirmType('logo')
                          }}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>
          )}

          {view === 'mediebibliotek' && (
            <SectionShell eyebrow="Indhold" title="Mediebibliotek" width="max-w-6xl">
              <MediaLibrary />
            </SectionShell>
          )}

          {activeView === null && (
            <div className="flex flex-1 items-center justify-center px-6">
              <EmptyState
                icon={<Layout size={22} />}
                title="Vælg en side for at komme i gang"
                description="Siderne ligger i menuen til venstre. Vælg en side for at se og redigere dens sektioner."
              />
            </div>
          )}

          {currentPage && activeView === 'page' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--surface)] px-6 py-3.5">
                <div className="min-w-0">
                  <p className="admin-eyebrow mb-1">
                    Side <span className="admin-num normal-case tracking-normal">/{currentPage.slug}</span>
                  </p>
                  <h2 className="truncate text-[15px] font-semibold leading-tight text-[var(--ink)]">
                    {currentPage.title}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="admin-num mr-1 text-[11px] text-[var(--ink-3)]">
                    {currentPage.blocks.length}{' '}
                    {currentPage.blocks.length === 1 ? 'sektion' : 'sektioner'}
                  </span>
                  <Button
                    variant={showPreview ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowPreview(v => !v)}
                    aria-pressed={showPreview}
                    title="Vis eller skjul preview af siden"
                  >
                    <Monitor size={15} />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingMeta(true)}>
                    <Search size={15} />
                    SEO
                  </Button>
                  <Link
                    href={`/${currentPage.slug === 'home' ? '' : currentPage.slug}`}
                    target="_blank"
                    className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                  >
                    <Eye size={15} />
                    Vis side
                  </Link>
                </div>
              </div>

              {/* Outline on the left, preview on the right. min-h-0 on both
                  columns is what lets each scroll inside a bounded height
                  instead of stretching the row. */}
              <div className="flex min-h-0 flex-1">
                <div
                  className={cx(
                    'min-h-0 min-w-0 flex-1 flex-col',
                    showPreview ? 'hidden lg:flex' : 'flex'
                  )}
                >
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto max-w-3xl">
                  {/* One DndContext spans the palette and the list, so a palette
                      chip can be dropped at any gap in the block list. */}
                  <DndContext
                    sensors={blockSensors}
                    collisionDetection={closestCenter}
                    onDragStart={disarmRowClick}
                    onDragOver={handleBlockDragOver}
                    onDragEnd={handleBlockDragEnd}
                    onDragCancel={() => {
                      disarmRowClick()
                      setBlockDrop(null)
                    }}
                  >
                    <div className="admin-spine space-y-1.5">
                      <BlockSortableList ids={currentPage.blocks.map(b => b.id)}>
                        {currentPage.blocks.map((block, index) => (
                          <SortableBlockRow
                            key={block.id}
                            id={block.id}
                            index={index}
                            total={currentPage.blocks.length}
                            label={getBlockLabel(block.type)}
                            summary={
                              block.content?.title ||
                              block.content?.body?.slice?.(0, 60) ||
                              block.content?.description?.slice?.(0, 60) ||
                              'Uden titel'
                            }
                            icon={getBlockIcon(block.type)}
                            isEditing={editingBlock === block.id}
                            dropSide={
                              blockDrop?.overId === block.id ? blockDrop.side : null
                            }
                            onOpen={setEditingBlock}
                            onDelete={blockId =>
                              setBlockDeleteConfirm({
                                pageSlug: currentPage.slug,
                                blockId,
                              })
                            }
                            onMove={(from, to) => moveBlock(currentPage.slug, from, to)}
                          />
                        ))}
                      </BlockSortableList>
                    </div>

                    <ListEndZone
                      isOver={blockDrop?.overId === 'list-end'}
                      onClick={() => setShowComponentPicker(true)}
                    >
                      <Plus size={18} className="mx-auto mb-1.5 text-[var(--ink-3)]" />
                      <p className="text-[13px] font-medium text-[var(--ink-2)]">
                        {blockDrop?.overId === 'list-end'
                          ? 'Slip for at flytte til sidst'
                          : 'Tilføj sektion'}
                      </p>
                    </ListEndZone>
                  </DndContext>

                  {currentPage.blocks.length === 0 && (
                    <p className="mt-3 text-center text-[13px] text-[var(--ink-3)]">
                      Siden er tom. Klik på &quot;Tilføj sektion&quot; for at komme i gang.
                    </p>
                  )}
                  </div>
                </div>
                </div>

                {showPreview && (
                  <div className="min-h-0 w-full shrink-0 lg:w-[24rem] xl:w-[28rem]">
                    <PagePreview slug={currentPage.slug} revision={previewRevision} />
                  </div>
                )}
              </div>

              {editingBlock && currentPage.blocks.find(b => b.id === editingBlock) && (
                <SlideOver
                  open
                  onClose={() => setEditingBlock(null)}
                  eyebrow="Sektion"
                  title={getBlockLabel(
                    currentPage.blocks.find(b => b.id === editingBlock)?.type || ''
                  )}
                  footer={
                    <>
                      <Button variant="ghost" onClick={() => setEditingBlock(null)}>
                        Annullér
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          const form = document.querySelector<HTMLFormElement>('#block-edit-form')
                          form?.requestSubmit()
                        }}
                      >
                        Gem ændringer
                      </Button>
                    </>
                  }
                >
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
                </SlideOver>
              )}
              </div>
          )}
        </main>
      </div>


      {showComponentPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowComponentPicker(false)}>
          <div className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--ink)]">Vælg komponent</h3>
              <button onClick={() => setShowComponentPicker(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {blockTypes.map((blockType) => (
                <button
                  key={blockType.type}
                  onClick={() => addBlockFromPanel(blockType.type as CMSBlock['type'])}
                  className="p-4 rounded-lg border border-[var(--hairline)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors text-left"
                >
                  <blockType.icon size={24} className="text-[var(--accent)] mb-2" />
                  <div className="font-medium text-[var(--ink)]">{blockType.label}</div>
                  <div className="text-xs text-[var(--ink-2)]">{blockType.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreatePage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePage(false)}>
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--hairline)]">
              <h3 className="text-sm font-semibold text-[var(--ink)]">Opret ny side</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  className="admin-input"
                  placeholder="Min nye side"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Slug</label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="admin-input"
                  placeholder="min-nye-side"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overordnet side (valgfrit)</label>
                <select
                  value={newPageParent}
                  onChange={e => setNewPageParent(e.target.value)}
                  className="admin-input"
                >
                  <option value="">Ingen</option>
                  {pages.map(p => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
              <button
                onClick={() => setShowCreatePage(false)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  if (newPageTitle && newPageSlug) {
                    const page = createPage(newPageTitle, newPageSlug, newPageParent || undefined)
                    if (page) {
                      // page.slug is cumulative (parent/child); the bare slug
                      // matched nothing when the page was created under a parent.
                      openPage(page.slug)
                    }
                    setShowCreatePage(false)
                    setNewPageTitle('')
                    setNewPageSlug('')
                    setNewPageParent('')
                  }
                }}
                disabled={!newPageTitle || !newPageSlug}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Opret side
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--danger-soft)] flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-[var(--danger)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                {deleteConfirmType === 'nav' ? 'Slet navigationspunkt?' : 
                 deleteConfirmType === 'child' ? 'Slet underpunkt?' :
                 deleteConfirmType === 'case' ? 'Slet case?' :
                 deleteConfirmType === 'testimonial' ? 'Slet udtalelse?' :
                 deleteConfirmType === 'logo' ? 'Slet logo?' :
                 deleteConfirmType === 'user' ? 'Slet bruger?' : 'Slet side?'}
              </h3>
              <p className="text-[var(--ink-2)]">
                Er du sikker på at du vil slette dette? Denne handling kan ikke fortrydes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
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
                      // The open page is gone, so fall back to the library
                      // rather than to whichever page happens to be next.
                      router.push('/admin/sider')
                    }
                  }
                  setDeleteConfirm(null)
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--danger)] px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}

      {blockDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBlockDeleteConfirm(null)}>
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--danger-soft)] flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-[var(--danger)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
                Slet sektion?
              </h3>
              <p className="text-[var(--ink-2)]">
                Er du sikker på at du vil slette denne sektion? Denne handling kan ikke fortrydes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
              <button
                onClick={() => setBlockDeleteConfirm(null)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  removeBlock(blockDeleteConfirm.pageSlug, blockDeleteConfirm.blockId)
                  setBlockDeleteConfirm(null)
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--danger)] px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
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
              openPage(newSlug)
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
            const { slug, ...metaWithoutSlug } = meta
            updatePageMeta(selectedPage!, metaWithoutSlug)
            if (slug && slug !== selectedPage) {
              updatePageDetails(selectedPage!, currentPage.title, slug, currentPage.parentSlug)
              setSelectedPage(slug)
            }
            setEditingMeta(false)
          }}
          onSelectImage={() => setSelectingMetaImage(true)}
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
            if (selectingMetaImage) {
              updatePageMeta(selectedPage!, { image: url })
              setSelectingMetaImage(false)
            } else if (mediaPickerTarget === 'logo') {
              updateContactForm({ logo: url })
            } else if (mediaPickerTarget === 'favicon') {
              updateContactForm({ favicon: url })
            } else if (mediaPickerConfig && mediaPickerConfig.blockId && selectedPage) {
              const blockId = mediaPickerConfig.blockId
              // While the edit panel is open the pick is unsaved work: hand it to
              // the panel so it commits with "Gem ændringer" like every other field.
              if (blockEditRef.current) {
                blockEditRef.current(mediaPickerConfig.fieldKey, url)
              } else {
                const block = currentPage?.blocks.find(b => b.id === blockId)
                if (block) {
                  updateBlockContent(selectedPage, blockId, {
                    ...block.content,
                    [mediaPickerConfig.fieldKey]: url
                  })
                }
              }
            }
            setShowMediaPicker(false)
            setMediaPickerConfig(null)
          }}
          onClose={() => {
            setShowMediaPicker(false)
            setMediaPickerConfig(null)
            setSelectingMetaImage(false)
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
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--ink)]">Support</h3>
              <button onClick={() => setShowSupport(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
            </div>
            <div className="p-6 space-y-3">
              <a
                href={`tel:${contactInfo.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 py-3 font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
              >
                <Phone size={18} />
                {contactInfo.phone || 'Intet telefonnummer'}
              </a>
              <a
                href={`mailto:${contactInfo.email}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] text-[var(--ink-2)] rounded-lg transition-colors font-medium"
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

function getBlockLabel(type: string) {
  return blockTypes.find(b => b.type === type)?.label || type
}

function BlockEditModal({ block, onClose, onSave, onOpenMediaPicker, updateLocalContentRef }: { block: CMSBlock; onClose: () => void; onSave: (content: Record<string, any>) => void; onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void; updateLocalContentRef?: React.MutableRefObject<((fieldKey: string | null, url?: string) => void) | null> }) {
  const [localContent, setLocalContent] = useState(block.content || {})
  const mediaPickerOpenRef = useRef(false)

  // Re-sync from the CMS, but never while the media picker is open: the picker
  // writes straight to the CMS, and syncing mid-flight would clobber the edit.
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

  // The media picker writes straight to the CMS, so it pushes the new value in
  // here too. Without this the field would look empty until the panel is reopened.
  // A null fieldKey is the signal that the picker closed, which re-enables the
  // block.content sync above.
  useEffect(() => {
    if (!updateLocalContentRef) return
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
    return () => {
      updateLocalContentRef.current = null
    }
  }, [updateLocalContentRef])

  return (
    <div className="space-y-4">
      {block.type === 'hero' && (
        <>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Badge</label>
            <input
              type="text"
              value={localContent.badge || ''}
              onChange={e => setLocalContent({ ...localContent, badge: e.target.value })}
              className="admin-input"
              placeholder="f.eks. Webbureau i Danmark"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel (H1)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Beskrivelse</label>
            <textarea
              value={localContent.description || localContent.subtitle || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value, subtitle: e.target.value })}
              rows={4}
              className="admin-input"
              placeholder="Beskrivelse af sektionen..."
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Tekstjustering</label>
            <select
              value={localContent.alignment || 'center'}
              onChange={e => setLocalContent({ ...localContent, alignment: e.target.value })}
              className="admin-input"
            >
              <option value="center">Centreret</option>
              <option value="left">Venstre</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Baggrundstype</label>
            <select
              value={localContent.backgroundType || 'gradient'}
              onChange={e => setLocalContent({ ...localContent, backgroundType: e.target.value })}
              className="admin-input"
            >
              <option value="gradient">Gradient</option>
              <option value="image">Baggrundsbillede</option>
              <option value="video">Baggrundsvideo</option>
            </select>
          </div>
          {localContent.backgroundType === 'image' && (
            <div>
              <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Baggrundsbillede</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localContent.backgroundImage || ''}
                  onChange={e => setLocalContent({ ...localContent, backgroundImage: e.target.value })}
                  className="admin-input"
                  placeholder="/images/hero.jpg"
                />
                <button
                  type="button"
                  onClick={() => handleMediaClick('backgroundImage')}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
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
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--danger)] text-white transition-opacity hover:opacity-90"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
          {localContent.backgroundType === 'video' && (
            <div>
              <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Baggrundsvideo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localContent.backgroundVideo || ''}
                  onChange={e => setLocalContent({ ...localContent, backgroundVideo: e.target.value })}
                  className="admin-input"
                  placeholder="/videos/hero.mp4"
                />
                <button
                  type="button"
                  onClick={() => handleMediaClick('backgroundVideo')}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
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
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--danger)] text-white transition-opacity hover:opacity-90"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
          {(localContent.backgroundType === 'image' || localContent.backgroundType === 'video') && (
            <div>
              <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overlay dækning (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={localContent.backgroundOverlay ?? 0.5}
                onChange={e => setLocalContent({ ...localContent, backgroundOverlay: parseFloat(e.target.value) })}
                className="admin-input"
              />
            </div>
          )}
          <div className="border-t border-[var(--hairline)] pt-4 mt-4">
            <h4 className="text-sm font-medium text-[var(--ink-2)] mb-3">Knapper</h4>
            {[1, 2].map((num) => (
              <div key={num} className="mb-4 p-3 bg-[var(--surface-sunken)] rounded-lg">
                <label className="block text-xs font-medium text-[var(--ink-2)] mb-2">Knap {num}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={localContent[`button${num}Label`] || ''}
                    onChange={e => setLocalContent({ ...localContent, [`button${num}Label`]: e.target.value })}
                    className="admin-input px-3 py-1.5 text-sm"
                    placeholder={`Knap ${num} tekst`}
                  />
                  <input
                    type="text"
                    value={localContent[`button${num}Href`] || ''}
                    onChange={e => setLocalContent({ ...localContent, [`button${num}Href`]: e.target.value })}
                    className="admin-input px-3 py-1.5 text-sm"
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
              className="w-4 h-4 rounded border-[var(--hairline-strong)]"
            />
            <label htmlFor="showStats" className="text-sm text-[var(--ink-2)]">Vis statistik</label>
          </div>
          {localContent.showStats !== false && (
            <div className="border-t border-[var(--hairline)] pt-4 mt-4">
              <h4 className="text-sm font-medium text-[var(--ink-2)] mb-3">Statistik</h4>
              {[1, 2, 3].map((num) => (
                <div key={num} className="mb-4 p-3 bg-[var(--surface-sunken)] rounded-lg">
                  <label className="block text-xs font-medium text-[var(--ink-2)] mb-2">Stat {num}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={localContent[`stat${num}Number`] || ''}
                      onChange={e => setLocalContent({ ...localContent, [`stat${num}Number`]: e.target.value })}
                      className="admin-input px-3 py-1.5 text-sm"
                      placeholder="50+"
                    />
                    <input
                      type="text"
                      value={localContent[`stat${num}Label`] || ''}
                      onChange={e => setLocalContent({ ...localContent, [`stat${num}Label`]: e.target.value })}
                      className="admin-input px-3 py-1.5 text-sm"
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
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Indhold</label>
            <textarea
              value={localContent.body || ''}
              onChange={e => setLocalContent({ ...localContent, body: e.target.value })}
              rows={6}
              className="admin-input"
            />
          </div>
        </>
      )}
      
      {block.type === 'cta' && (
        <>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel (H2)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Beskrivelse</label>
            <textarea
              value={localContent.description || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value })}
              rows={4}
              className="admin-input"
            />
          </div>
        </>
      )}

      {block.type === 'contentImage' && (
        <>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Layout</label>
            <select
              value={localContent.layout || 'image-left'}
              onChange={e => setLocalContent({ ...localContent, layout: e.target.value })}
              className="admin-input"
            >
              <option value="image-left">Billede til venstre</option>
              <option value="image-right">Billede til højre</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel (H2)</label>
            <input
              type="text"
              value={localContent.title || ''}
              onChange={e => setLocalContent({ ...localContent, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Beskrivelse</label>
            <textarea
              value={localContent.description || ''}
              onChange={e => setLocalContent({ ...localContent, description: e.target.value })}
              rows={4}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Knap tekst</label>
            <input
              type="text"
              value={localContent.buttonText || ''}
              onChange={e => setLocalContent({ ...localContent, buttonText: e.target.value })}
              className="admin-input"
              placeholder="f.eks. Læs mere"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Knap link</label>
            <input
              type="text"
              value={localContent.buttonLink || ''}
              onChange={e => setLocalContent({ ...localContent, buttonLink: e.target.value })}
              className="admin-input"
              placeholder="f.eks. /ydelser"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Billede URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localContent.image || ''}
                onChange={e => setLocalContent({ ...localContent, image: e.target.value })}
                className="admin-input"
                placeholder="https://..."
              />
              {onOpenMediaPicker && (
                <button
                  type="button"
                  onClick={() => handleMediaClick('image')}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--surface-hover)] px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-sunken)]"
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
            {localContent.image && (
              <div className="mt-2 relative w-full h-32 bg-[var(--surface-hover)] bg-[var(--surface)] rounded-lg overflow-hidden">
                <img src={localContent.image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setLocalContent({ ...localContent, image: '' })}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-[var(--danger)] text-white transition-opacity hover:opacity-90"
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
            <label className="block text-sm font-medium text-[var(--ink-2)]">Statistikker</label>
            <button
              type="button"
              onClick={() => {
                const newStats = [
                  ...(localContent.stats || []),
                  { id: generateId('stat-new'), number: '0', label: 'Ny statistik' }
                ]
                setLocalContent({ ...localContent, stats: newStats })
              }}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]"
            >
              + Tilføj
            </button>
          </div>
          {(localContent.stats || []).map((stat: any, index: number) => (
            <div key={stat.id} className="p-3 bg-[var(--surface-sunken)] bg-[var(--surface-hover)] rounded-lg mb-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={stat.number || ''}
                  onChange={e => {
                    const newStats = [...(localContent.stats || [])]
                    newStats[index] = { ...stat, number: e.target.value }
                    setLocalContent({ ...localContent, stats: newStats })
                  }}
                  className="admin-input px-3 py-1.5 text-sm"
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
                  className="admin-input px-3 py-1.5 text-sm"
                  placeholder="Label"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newStats = (localContent.stats || []).filter((_: any, i: number) => i !== index)
                    setLocalContent({ ...localContent, stats: newStats })
                  }}
                  className="p-1.5 text-[var(--danger)] hover:text-[var(--danger)]"
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
            <label className="block text-sm font-medium text-[var(--ink-2)]">Galleri elementer</label>
            <button
              type="button"
              onClick={() => {
                const newItems = [
                  ...(localContent.items || []),
                  { id: generateId('gallery-new'), title: 'Nyt projekt', category: 'Hjemmeside' }
                ]
                setLocalContent({ ...localContent, items: newItems })
              }}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]"
            >
              + Tilføj
            </button>
          </div>
          {(localContent.items || []).map((item: any, index: number) => (
            <div key={item.id} className="p-3 bg-[var(--surface-sunken)] bg-[var(--surface-hover)] rounded-lg mb-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={e => {
                    const newItems = [...(localContent.items || [])]
                    newItems[index] = { ...item, title: e.target.value }
                    setLocalContent({ ...localContent, items: newItems })
                  }}
                  className="admin-input px-3 py-1.5 text-sm"
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
                  className="admin-input px-3 py-1.5 text-sm"
                  placeholder="Kategori"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newItems = (localContent.items || []).filter((_: any, i: number) => i !== index)
                    setLocalContent({ ...localContent, items: newItems })
                  }}
                  className="p-1.5 text-[var(--danger)] hover:text-[var(--danger)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      
      {/* The save action lives in the slide-over footer; this form lets the
          footer button submit it, and Enter works in any field. */}
      <form id="block-edit-form" onSubmit={e => { e.preventDefault(); handleSave() }} className="hidden" />
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger navigationspunkt</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Link</label>
            <input
              type="text"
              value={href}
              onChange={e => setHref(e.target.value)}
              className="admin-input"
              placeholder="/min-side"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Eller vælg side</label>
            <select
              value={pageSlug}
              onChange={e => handlePageChange(e.target.value)}
              className="admin-input"
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
              className="w-4 h-4 rounded border-[var(--hairline-strong)]"
            />
            <label htmlFor="editNewTab" className="text-sm text-[var(--ink-2)]">Åbn i ny fane</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
          >
            Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

function MetaEditModal({ page, onClose, onSave, onSelectImage }: { page: any; onClose: () => void; onSave: (meta: { title: string; description: string; image: string; slug: string }) => void; onSelectImage?: () => void }) {
  const [metaTitle, setMetaTitle] = useState(page.meta?.title || '')
  const [metaDescription, setMetaDescription] = useState(page.meta?.description || '')
  const [metaImage, setMetaImage] = useState(page.meta?.image || '')
  const [slug, setSlug] = useState(page.slug || '')

  const handleSave = () => {
    onSave({ title: metaTitle, description: metaDescription, image: metaImage, slug })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger SEO</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Slug (URL)</label>
            <Input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder={page.title?.toLowerCase().replace(/\s+/g, '-') || ''}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Meta Titel</label>
            <input
              type="text"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              className="admin-input"
              placeholder={`${page.title} | StayMain`}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Meta Beskrivelse</label>
            <textarea
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              rows={4}
              className="admin-input"
              placeholder="Kort beskrivelse af siden..."
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Meta Billede</label>
            <div className="flex items-center gap-3">
              <div className="h-24 flex-1 overflow-hidden rounded-lg border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-sunken)]">
                {metaImage ? (
                  <img src={metaImage} alt="Meta" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[13px] text-[var(--ink-3)]">
                    Ingen billede valgt
                  </div>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => onSelectImage?.()}>
                Vælg billede
              </Button>
            </div>
          </div>
          <div className="border-t border-[var(--hairline)] pt-4">
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Google Søgning Preview</label>
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)] p-4">
              <div className="flex flex-col">
                <span className="text-sm text-[var(--ink-2)] truncate">
                  staymain.dk{slug === 'home' ? '' : `/${slug}`}
                </span>
                <span className="text-xl text-[var(--accent)] hover:underline cursor-pointer truncate">
                  {metaTitle || `${page.title} | StayMain`}
                </span>
                <span className="text-sm text-[var(--ink-2)] leading-snug">
                  {metaDescription || <span className="text-[var(--ink-3)] italic">Ingen meta beskrivelse angivet...</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger side</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Slug</label>
            <input
              type="text"
              value={pageSlug}
              onChange={e => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Overordnet side</label>
            <select
              value={parentSlug}
              onChange={e => setParentSlug(e.target.value)}
              className="admin-input"
            >
              <option value="">Ingen</option>
              {pages.filter(p => p.slug !== page.slug).map(p => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90"
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
      id: generateId('nav'),
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Tilføj navigationspunkt</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Link</label>
            <input
              type="text"
              value={href}
              onChange={e => setHref(e.target.value)}
              className="admin-input"
              placeholder="/min-side"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Eller vælg side</label>
            <select
              value={pageSlug}
              onChange={e => handlePageChange(e.target.value)}
              className="admin-input"
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
              className="w-4 h-4 rounded border-[var(--hairline-strong)]"
            />
            <label htmlFor="newTab" className="text-sm text-[var(--ink-2)]">Åbn i ny fane</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={!label}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Opret bruger</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="admin-input"
              placeholder="brugernavn@staymain.dk"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Adgangskode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="admin-input"
              />
              <button
                onClick={() => setPassword(onGenerate())}
                className="px-3 py-2 bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                title="Generer kode"
              >
                <RefreshCw size={18} className="text-[var(--ink-2)]" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !email || !password}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger bruger</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Gemmer...' : 'Gem e-mail'}
            </button>
          </div>
          
          <div className="border-t border-[var(--hairline)] pt-4">
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Ny adgangskode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="admin-input"
                placeholder="Ny adgangskode"
              />
              <button
                onClick={handleSavePassword}
                disabled={loading || !newPassword}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Skift
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--hairline)] flex justify-between">
          {usersLength > 1 && (
            <button 
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors disabled:opacity-50"
            >
              Slet bruger
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              Annuller
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading || !email.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <Modal
      open
      onClose={onClose}
      title="Bruger oprettet"
      description="Kopiér disse oplysninger og gem dem et sikkert sted."
      footer={
        <Button variant="primary" onClick={onClose}>
          Jeg har gemt dem
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-sunken)] px-3 py-2.5">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--danger)]" />
          <p className="text-[13px] leading-snug text-[var(--ink-2)]">
            Adgangskoden vises kun her. Den kan ikke hentes igen senere.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)] p-4">
          <div>
            <p className="admin-eyebrow mb-1.5">E-mail</p>
            <p className="admin-num text-sm text-[var(--ink)]">{email}</p>
          </div>
          <div>
            <p className="admin-eyebrow mb-1.5">Adgangskode</p>
            <p className="admin-num text-sm text-[var(--ink)]">{password}</p>
          </div>
        </div>
      </div>
    </Modal>
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
      const res = await fetch('/api/media', { method: 'POST', headers: await authHeaders(), body: formData })
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
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger case</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Link (valgfrit)</label>
            <input type="text" value={link} onChange={e => setLink(e.target.value)} className="admin-input" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Billede</label>
            {image && <img src={image} alt="Preview" className="w-full h-48 object-cover mb-2 bg-white rounded-lg p-2" />}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <ImageIcon size={16} className="text-[var(--ink-3)]" />
                <span className="text-sm text-[var(--ink-2)]">Mediebibliotek</span>
              </button>
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">
                <Upload size={16} className="text-[var(--ink-3)]" />
                <span className="text-sm text-[var(--ink-2)]">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--hairline)] flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors">
            Slet case
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50">
              Annuller
            </button>
            <button onClick={handleSave} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90">
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
      const res = await fetch('/api/media', { method: 'POST', headers: await authHeaders(), body: formData })
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
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger udtalelse</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Titel</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Udtalelse</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Billede</label>
            {image && <img src={image} alt={name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2" />}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <ImageIcon size={16} className="text-[var(--ink-3)]" />
                <span className="text-sm text-[var(--ink-2)]">Mediebibliotek</span>
              </button>
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">
                <Upload size={16} className="text-[var(--ink-3)]" />
                <span className="text-sm text-[var(--ink-2)]">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--hairline)] flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors">
            Slet udtalelse
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50">
              Annuller
            </button>
            <button onClick={handleSave} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90">
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
      const res = await fetch('/api/media', { headers: await authHeaders() })
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
          headers: await authHeaders(),
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
        headers: await authHeaders(),
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

  const uploadLabel = (label: string, className?: string) => (
    <label
      className={cx(
        'inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-2.5 text-xs font-medium text-[var(--surface)] transition-opacity hover:opacity-90',
        uploading && 'pointer-events-none opacity-60',
        className
      )}
    >
      {uploading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Upload size={14} />
      )}
      {label}
      <input
        type="file"
        className="sr-only"
        multiple
        accept="image/*,video/*,audio/*,.pdf"
        onChange={handleUpload}
        disabled={uploading}
      />
    </label>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg efter filer..."
          aria-label="Søg efter filer"
          className="max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filtype">
          {categories.map(cat => {
            const active = filter === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                aria-pressed={active}
                className={cx(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--ink-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]'
                )}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="admin-num text-[11px] text-[var(--ink-3)]">
            {displayedFiles.length}
            {search ? ` af ${files.length}` : ''} filer
          </span>
          {uploadLabel(uploading ? 'Uploader…' : 'Upload filer')}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-[var(--hairline)] py-16">
          <Loader2 size={22} className="animate-spin text-[var(--ink-3)]" />
        </div>
      ) : displayedFiles.length === 0 ? (
        <EmptyState
          icon={<Folder size={22} />}
          title={search ? 'Ingen filer matcher din søgning' : 'Ingen filer endnu'}
          description={
            search
              ? 'Prøv et andet søgeord, eller ryd filteret.'
              : 'Upload billeder, videoer, lyd eller dokumenter, så kan du bruge dem på sitet.'
          }
          action={search ? undefined : uploadLabel('Upload den første fil')}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {displayedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface)] transition-colors hover:border-[var(--hairline-strong)]"
            >
              <div className="relative flex aspect-square items-center justify-center bg-[var(--surface-sunken)]">
                {file.category === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[var(--ink-3)]">{getFileIcon(file.category)}</span>
                )}

                {/* Actions live on the thumbnail, matching the logo grid, so
                    there's no full-bleed black overlay covering the preview. */}
                <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--surface)]/90 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(file.url)}
                      aria-label={`Kopiér URL for ${file.name}`}
                      title="Kopiér URL"
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                    >
                      {copiedUrl === file.url ? (
                        <Check size={13} className="text-[var(--success)]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--surface)]/90 backdrop-blur">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Åbn ${file.name} i ny fane`}
                      title="Åbn i ny fane"
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--surface)]/90 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => handleDelete(file.name)}
                      aria-label={`Slet ${file.name}`}
                      title="Slet"
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
              </div>

              <div className="px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-[var(--ink)]" title={file.name}>
                  {file.name}
                </p>
                <p className="admin-num mt-0.5 text-[10px] text-[var(--ink-3)]">
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
      const res = await fetch('/api/media', { headers: await authHeaders() })
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
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-4xl flex-col rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Mediebibliotek</h3>
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--ink)] px-3 py-1.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90">
              <Upload size={14} />
              {uploading ? 'Uploader...' : 'Upload'}
              <input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }} />
            </label>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
          </div>
        </div>
        
        <div className="px-6 py-3 border-b border-[var(--hairline)]">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === cat.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--ink-2)] hover:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]'
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
              <Loader2 size={32} className="animate-spin text-[var(--ink-3)]" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-[var(--ink-2)]">
              <Folder size={48} className="mx-auto mb-4 text-[var(--ink-3)]" />
              <p>Ingen filer i denne kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file, index) => (
                <button
                  key={`${file.name}-${index}`}
                  onClick={() => { onSelect(file.url); onClose() }}
                  className="group bg-[var(--surface-hover)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--accent)] transition-all"
                >
                  <div className="aspect-square flex items-center justify-center">
                    {file.category === 'image' ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[var(--ink-3)]">
                        {file.category === 'video' && <Film size={32} />}
                        {file.category === 'audio' && <Music size={32} />}
                        {file.category === 'document' && <FileText size={32} />}
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs text-[var(--ink-2)] truncate">{file.name}</p>
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
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Rediger logo</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Website (valgfrit)</label>
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="admin-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Logo</label>
            {image && <img src={image} alt="Preview" className="w-full h-24 object-contain mb-2 bg-white rounded-lg p-2" />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <Folder size={18} className="text-[var(--ink-3)]" />
                <span className="text-[var(--ink-2)]">Mediebibliotek</span>
              </button>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">
                <input type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }} />
                <Upload size={18} className="text-[var(--ink-3)]" />
                <span className="text-[var(--ink-2)]">{uploading ? 'Uploader...' : 'Upload fra pc'}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--hairline)] flex justify-between gap-3">
          <button onClick={onDelete} className="px-4 py-2 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors">
            Slet logo
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50">
              Annuller
            </button>
            <button onClick={handleSave} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-3.5 text-sm font-medium text-[var(--surface)] transition-opacity hover:opacity-90">
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

export default function AdminPage() {
  const router = useRouter()
  // Every section has a URL now, so there is nothing to render here. Sending
  // people to a real address keeps the rail, the browser history and any
  // shared link pointing at the same place.
  useEffect(() => {
    router.replace(`/admin/${DEFAULT_SECTION}`)
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-[var(--ink-2)]">Indlæser...</div>
    </div>
  )
}
