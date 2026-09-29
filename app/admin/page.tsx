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
  Monitor,
  LayoutDashboard,
  Home,
  // Aliased: `Lock` on its own resolves to the global Navigator Lock API.
  Lock as LockIcon,
  AlertCircle
} from 'lucide-react'
import { useCMS, CMSBlock, NavItem, Case, Testimonial, CompanyLogo, ContactInfo } from '@/lib/cms'
import { uploadImage, authHeaders, uploadMediaFile, deleteMediaFiles } from '@/lib/supabase'
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
  sectionHref,
  type AdminSection,
  type AdminView,
} from './sections'
import { Dashboard } from './dashboard'
import { PageLibrary } from './page-library'
import {
  budgetState,
  budgetLabel,
  BUDGET_TONE,
  META_TITLE_LIMIT,
  META_DESCRIPTION_LIMIT,
} from './seo-budget'
import {
  HERO_IMPACTS,
  HERO_IMPACT_ORDER,
  heroImpact,
  defaultHeroContent,
  applyHeroImpact,
  contentBlocks,
} from '@/lib/hero'
import { SITE_URL } from '@/lib/site'
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
import { BlockFieldEditor } from './block-field-editor'
import { ADDABLE_BLOCK_TYPES, getBlockDefinition } from '@/lib/blocks'

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
 * The hero's row in the editor.
 *
 * Deliberately not a `SortableBlockRow`. It looks like one so the outline reads
 * as a single list, but it has no drag handle, no move arrows and no delete
 * button: every page has a hero, it sits above the sections, and none of those
 * three things should be possible. The impact level is on the row rather than
 * buried in the editor, because it is the first thing to decide about a page.
 */
function HeroPanel({
  block,
  isEditing,
  onOpen,
}: {
  block: CMSBlock
  isEditing: boolean
  onOpen: () => void
}) {
  const impact = heroImpact(block.content)
  const spec = HERO_IMPACTS[impact]

  return (
    <div className="mb-4">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        className={cx(
          'group flex cursor-pointer items-center gap-3 rounded-lg border py-3 pl-3 pr-2 transition-colors',
          isEditing
            ? 'border-[var(--accent-line)] bg-[var(--accent-soft)]'
            : 'border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--accent)]'
        )}
      >
        {/* Occupies the slot the block number uses, so the hero line up with the
            numbered rows under it. */}
        <span className="admin-num w-5 shrink-0 text-right text-[11px] text-[var(--accent)]">
          H1
        </span>
        <span className="shrink-0 text-[var(--accent)]">
          <Layout size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="admin-eyebrow block">Hero</span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--ink-2)]">
            {block.content?.title || 'Uden titel'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded border border-[var(--hairline)] px-2 py-0.5 text-[11px] text-[var(--ink-2)]">
            {spec.label}
          </span>
          <IconButton label="Rediger hero" onClick={onOpen}>
            <Pencil size={14} />
          </IconButton>
        </span>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
        <LockIcon size={11} />
        Alle sider har en hero. Den kan ikke slettes eller flyttes.
      </p>
    </div>
  )
}

/**
 * Offers back a draft from an earlier session.
 *
 * The counterpart to making saving explicit: if nothing is written until the
 * button is pressed, then a closed laptop or a killed tab has to be recoverable,
 * or the model is a trap rather than a choice. WordPress and Payload both keep a
 * draft for exactly this, and both ask before putting it back rather than
 * applying it silently over a site that has moved on since.
 */
function DraftRecovery({
  at,
  onRestore,
  onDiscard,
}: {
  at: number
  onRestore: () => void
  onDiscard: () => void
}) {
  const when = new Date(at).toLocaleString('da-DK', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  return (
    <div className="border-b border-[var(--warning)] bg-[var(--warning-soft)] px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] leading-snug text-[var(--ink-2)]">
          <TriangleAlert size={15} className="shrink-0 text-[var(--warning)]" />
          <span>
            Der er ugemte ændringer fra <strong>{when}</strong>. De er ikke gemt på
            sitet.
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onDiscard}>
            Forkast
          </Button>
          <Button variant="primary" size="sm" onClick={onRestore}>
            <RefreshCw size={14} />
            Gendan
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * The one control that writes to the site.
 *
 * Only rendered when there is something unsaved, which is what it takes to stop
 * it being a permanently visible button that implies the rest of the admin works
 * this way. It sits in the header because the edits it commits can be made on any
 * screen - a block reorder, a menu drag, a contact field - so there is no one
 * screen that owns it.
 */
function SaveChanges({
  saving,
  saved,
  error,
  onSave,
}: {
  saving: boolean
  saved: boolean
  error: string | null
  onSave: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Announced rather than shown: "Gemt" lasts two seconds, which is not long
          to catch in the corner of your eye. */}
      <span aria-live="polite" className="sr-only">
        {error ? error : saved ? 'Ændringer gemt' : ''}
      </span>
      {/* A failure has to be seen, not just announced. It was on a tooltip and in
          a screen-reader-only span, which means the person who pressed save and
          watched nothing happen was the one person never told why. */}
      {error && (
        <span className="flex items-center gap-1.5 text-[13px] text-[var(--danger)]">
          <TriangleAlert size={14} className="shrink-0" />
          {error}
        </span>
      )}
      <Button
        onClick={onSave}
        variant={error ? 'secondary' : 'primary'}
        disabled={saving}
        size="sm"
      >
        <Save size={15} />
        {saving ? 'Gemmer…' : saved ? 'Gemt' : error ? 'Prøv igen' : 'Gem ændringer'}
      </Button>
    </div>
  )
}

/**
 * The sections that can be added to a page.
 *
 * The list itself now lives in lib/blocks.ts, next to each block's fields and
 * defaults, so the picker, the outline row and the editor cannot disagree about
 * what a block is called. Only the icon components are resolved here, because
 * they are React and the registry is plain data.
 *
 * Hero is excluded: every page has one, pinned above these, so offering it here
 * would let somebody put a second one on a page.
 */
const BLOCK_ICON_MAP: Record<string, React.ElementType> = {
  type: Type,
  image: ImageIcon,
  settings: Settings,
  'message-square': MessageSquare,
  'bar-chart': BarChart3,
  megaphone: Megaphone,
  'file-text': FileText,
  'panel-top': Layout,
}

const blockTypes = ADDABLE_BLOCK_TYPES.map(def => ({
  type: def.type,
  label: def.label,
  description: def.description,
  icon: BLOCK_ICON_MAP[def.icon] ?? Layout,
}))

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
 * Rendered by `/admin`, by `/admin/sider`, by `/admin/[section]` and by
 * `/admin/sider/[...slug]`, so every screen has a URL that can be linked to and
 * Back works. The props say which screen to show; the component no longer decides
 * that for itself.
 */
export function AdminWorkspace({
  initialSlug,
  initialView = 'home',
  startCreatingPage,
}: {
  /** Page being edited. Present on /admin/sider/[...slug]. */
  initialSlug?: string
  /** Screen being shown. `home` is the dashboard at /admin. */
  initialView?: AdminView
  /** Opens the create-page dialog on arrival, for the /admin/sider/ny route. */
  startCreatingPage?: boolean
} = {}) {
  const { pages, navigation, users, contactInfo, isAuthenticated, currentUser, supabaseReady, logout, createPage, updatePageDetails, deletePage, addBlock, removeBlock, moveBlock, updateBlockContent, updatePageMeta, updateNavItem, addNavItem, removeNavItem, updateNavigation, moveNavItemToParent, convertToDropdown, setNavLayout, orderingPersisted, addUser, updateUser, updateUserPassword, deleteUser, generatePassword, fetchUsers, updateContactInfo, cases, testimonials, companyLogos, addCase, updateCase, deleteCase, addTestimonial, updateTestimonial, deleteTestimonial, addCompanyLogo, updateCompanyLogo, deleteCompanyLogo, hasUnsavedChanges, saving, saveError, save, confirmLeave, pendingDraftAt, restoreDraft, discardDraft } = useCMS()
  
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
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [blockDeleteConfirm, setBlockDeleteConfirm] = useState<{ pageSlug: string; blockId: string } | null>(null)

  const uploadToMediaLibrary = async (file: File): Promise<string | null> => {
    try {
      return (await uploadMediaFile(file)).url
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Uploaden mislykkedes')
      return null
    }
  }

  /**
   * The contact screens edit the working copy like everything else.
   *
   * They used to keep a parallel `contactForm` that only reached the site when
   * their own save button was pressed, and `goTo` reloaded that copy from
   * `contactInfo` on every arrival - so typing, clicking another rail item and
   * clicking back silently threw the edits away. Writing straight into the draft
   * removes the second copy, and with it the reload and the loss.
   */
  const updateContactForm = (updates: Partial<ContactInfo>) => updateContactInfo(updates)

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

  // The hero is pinned above the outline: it is not a row to drag, reorder or
  // delete, so it never enters the sortable list. Indices below are into
  // `editableBlocks` and are shifted by one before they reach moveBlock, whose
  // indices are into the whole array where the hero owns slot 0.
  const heroBlock = currentPage?.blocks.find(b => b.type === 'hero')
  const editableBlocks = currentPage ? contentBlocks(currentPage.blocks) : []

  /**
   * The preview iframe loads the real public page, so it shows what the site
   * has, not the draft. Reloading it on every block edit therefore reloaded a
   * document that had not changed yet - the frame is a full page load each time.
   *
   * It is driven by whether there is something unsaved instead: the preview is
   * stale exactly while the draft differs from the site, so it refreshes when
   * that goes away rather than on every keystroke.
   */
  useEffect(() => {
    if (!isAuthenticated || !isReady) return
    if (hasUnsavedChanges) return
    setPreviewRevision(r => r + 1)
  }, [hasUnsavedChanges, isAuthenticated, isReady])

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

  const [view, setView] = useState<AdminView>(initialView)
  // The route owns which screen is shown, so client navigation has to follow.
  useEffect(() => {
    setView(initialView)
  }, [initialView])

  /** Screen in view, plus a page editor when one is open. */
  const activeView = initialSlug ? 'page' : view

  /**
   * The brief "Gemt" that follows a successful save.
   *
   * Above the auth gate with the other hooks, which is the only place it can go:
   * a useState below an early return makes the hook count depend on whether
   * anybody is signed in, and React reports that as a change in the order of
   * hooks. Two other hooks in this file are anchored here for the same reason,
   * and this one arrived third.
   */
  const [savedFlash, setSavedFlash] = useState(false)

  if (!isAuthenticated || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-hover)] bg-[var(--surface-sunken)]">
        <div className="animate-pulse text-[var(--ink-2)]">Indlæser...</div>
      </div>
    )
  }

  const handleLogout = () => {
    // Signing out is the least recoverable way to leave: the session is gone and
    // there is no going back to the draft.
    if (!confirmLeave()) return
    logout()
    router.push('/')
  }

  /**
   * Moving between sections is a navigation, so each one gets a URL.
   *
   * Not guarded, unlike logout. The working copy lives in the CMS context above
   * this component, so a client-side navigation between admin sections carries it
   * over untouched - there is nothing to lose here, and a confirm on every rail
   * click would only teach the reader to dismiss a dialog that means nothing.
   */
  const goTo = (next: AdminSection) => {
    setEditingNavItem(null)
    setEditingBlock(null)
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
    const target = resolveBlockDrop(active, over, editableBlocks)
    setBlockDrop(target ? { overId: String(over.id), side: target.side } : null)
  }

  const handleBlockDragEnd = ({ active, over }: DragEndEvent) => {
    // Any press that is currently armed was a drag, not a click.
    disarmRowClick()
    setBlockDrop(null)
    if (!over || !selectedPage || !currentPage) return

    const target = resolveBlockDrop(active, over, editableBlocks)
    if (!target) return

    // +1 for the hero sitting in front of the list being dragged.
    moveBlock(selectedPage, target.from + 1, target.to + 1)
  }

  /**
   * The content a newly added block starts with.
   *
   * Lives in lib/blocks.ts so the seed, the editor and the renderer agree. The
   * previous version of this was a switch that knew about `stats` and `gallery`
   * but not `services`, and which seeded `cta.buttonText` for a field the CTA
   * renderer never read.
   */
  const getDefaultContent = (type: CMSBlock['type']): Record<string, any> => {
    if (type === 'hero') return defaultHeroContent()
    const def = getBlockDefinition(type)
    return def ? def.defaultContent() : {}
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

  /**
   * Presses the one save. The write is the context's, because it has to be the
   * only one: it works out what disappeared as well as what changed, and
   * re-baselines afterwards. All this adds is the "Gemt", since a save that gives
   * no feedback is indistinguishable from one that did nothing.
   */
  const handleSave = async () => {
    const ok = await save()
    if (!ok) return
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const getBlockIcon = (type: string) => {
    const blockType = blockTypes.find(b => b.type === type)
    const Icon = blockType?.icon || Layout
    return <Icon size={18} />
  }

  /**
   * A block's display name, from the registry rather than the addable list.
   *
   * `blockTypes` excludes the hero, so reading labels from it would fall back to
   * the raw type string for the one block the outline always shows.
   */
  const getBlockLabel = (type: string) => getBlockDefinition(type as CMSBlock['type'])?.label || type

  /**
   * The one-line summary on an outline row.
   *
   * Each block declares how to describe itself, so the row stops being a
   * hand-written special case per type - and a new block gets a sensible summary
   * without anyone remembering to write one.
   */
  const getBlockSummary = (block: CMSBlock) => {
    const def = getBlockDefinition(block.type)
    return def ? def.summary(block.content) : ''
  }

  const openPage = (slug: string) =>
    router.push(`/admin/sider/${slug.split('/').map(encodeURIComponent).join('/')}`)

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-[var(--surface)]">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-baseline gap-2.5">
              <span className="text-sm font-semibold tracking-tight">StayMain</span>
              <span className="admin-eyebrow">CMS</span>
            </div>
            {/* The way out to the site itself.
                A new tab, because leaving the admin this way is looking at
                something else rather than finishing a job here - and the editor
                holds unsaved work that a same-tab navigation would quietly
                throw away. A plain anchor rather than Link, so the public site's
                bundle is not prefetched on every admin page load for a link most
                editors never follow.
                noopener because target=_blank hands the new page a reference back
                to this one otherwise. */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Åbn sitet i en ny fane"
              aria-label="Åbn sitet i en ny fane"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
            >
              <Home size={16} />
            </a>
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

            {/* Only when there is something to save. Rendered unconditionally it
                is a control that sits disabled on a clean screen and invites the
                reader to wonder what it does. */}
            {hasUnsavedChanges && (
              <SaveChanges
                saving={saving}
                saved={savedFlash}
                error={saveError}
                onSave={handleSave}
              />
            )}
          </div>
        </div>
      </header>

      {pendingDraftAt !== null && (
        <DraftRecovery
          at={pendingDraftAt}
          onRestore={restoreDraft}
          onDiscard={discardDraft}
        />
      )}

      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-[13rem] shrink-0 flex-col overflow-y-auto border-r border-[var(--hairline)] bg-[var(--surface)] lg:flex">
          <div className="flex-1 space-y-6 px-3 py-4">
            {/* The dashboard. Not part of the Indhold group: it is not a kind of
                content, it is the way back to looking at all of it. */}
            <RailItem
              icon={<LayoutDashboard size={15} />}
              label="Oversigt"
              active={activeView === 'home'}
              onClick={() => router.push('/admin')}
            />

            <RailGroup label="Indhold">
              <RailItem
                icon={<FileText size={15} />}
                label="Sider"
                active={activeView === 'sider' || activeView === 'page'}
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
                        value={contactInfo.companyName}
                        onChange={e => updateContactForm({ companyName: e.target.value })}
                      />
                    </Field>

                    <Field label="E-mail" htmlFor="cf-email">
                      <Input
                        id="cf-email"
                        type="email"
                        value={contactInfo.email}
                        onChange={e => updateContactForm({ email: e.target.value })}
                      />
                    </Field>

                    <Field label="Telefon" htmlFor="cf-phone">
                      <Input
                        id="cf-phone"
                        type="tel"
                        value={contactInfo.phone}
                        onChange={e => updateContactForm({ phone: e.target.value })}
                      />
                    </Field>

                    <Field label="CVR-nummer" htmlFor="cf-cvr">
                      <Input
                        id="cf-cvr"
                        value={contactInfo.cvr}
                        onChange={e => updateContactForm({ cvr: e.target.value })}
                      />
                    </Field>

                    <Field label="Adresse" htmlFor="cf-address" className="sm:col-span-2">
                      <Input
                        id="cf-address"
                        value={contactInfo.address}
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
                    value={contactInfo.logo}
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
                    value={contactInfo.favicon}
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
                          value={contactInfo.headerButtonText}
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
                          value={contactInfo.footerDescription}
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
                          value={contactInfo.footerCol2Title}
                          onChange={e => updateContactForm({ footerCol2Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
                        <div className="space-y-2">
                          {(contactInfo.footerCol2Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactInfo.footerCol2Links || [])]
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
                                    const newLinks = [...(contactInfo.footerCol2Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol2Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactInfo.footerCol2Links || []).filter((_, i) => i !== index)
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
                              updateContactForm({ footerCol2Links: [...(contactInfo.footerCol2Links || []), newLink] })
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
                          value={contactInfo.footerCol3Title}
                          onChange={e => updateContactForm({ footerCol3Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
                        <div className="space-y-2">
                          {(contactInfo.footerCol3Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactInfo.footerCol3Links || [])]
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
                                    const newLinks = [...(contactInfo.footerCol3Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol3Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactInfo.footerCol3Links || []).filter((_, i) => i !== index)
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
                              updateContactForm({ footerCol3Links: [...(contactInfo.footerCol3Links || []), newLink] })
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
                          value={contactInfo.footerCol4Title}
                          onChange={e => updateContactForm({ footerCol4Title: e.target.value })}
                          className="admin-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Links</label>
                        <div className="space-y-2">
                          {(contactInfo.footerCol4Links || []).map((link, index) => (
                            <div key={link.id} className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={e => {
                                    const newLinks = [...(contactInfo.footerCol4Links || [])]
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
                                    const newLinks = [...(contactInfo.footerCol4Links || [])]
                                    newLinks[index] = { ...newLinks[index], href: e.target.value }
                                    updateContactForm({ footerCol4Links: newLinks })
                                  }}
                                  placeholder="URL"
                                  className="admin-input px-2 py-1.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newLinks = (contactInfo.footerCol4Links || []).filter((_, i) => i !== index)
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
                              updateContactForm({ footerCol4Links: [...(contactInfo.footerCol4Links || []), newLink] })
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

          {/* The dashboard `/admin` opens on, and the page library `/admin/sider`
              opens on. Both are drawn from here rather than redirecting to a
              route of their own, so both keep the rail around them and both sit
              at the address they were asked for. */}
          {activeView === 'home' && <Dashboard />}

          {activeView === 'sider' && !currentPage && <PageLibrary />}

          {/* A slug in the URL that matches no page. Left blank it read as a
              half-loaded editor rather than a wrong address. */}
          {activeView === 'page' && !currentPage && (
            <div className="flex flex-1 items-center justify-center px-6">
              <EmptyState
                icon={<Layout size={22} />}
                title="Siden findes ikke"
                description="Den kan være slettet, eller have en stavefejl i stien."
                action={
                  <Button variant="secondary" onClick={() => router.push('/admin/sider')}>
                    <FileText size={15} />
                    Se alle sider
                  </Button>
                }
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
                  {/* The hero, pinned above the outline. */}
                  {heroBlock && (
                    <HeroPanel
                      block={heroBlock}
                      isEditing={editingBlock === heroBlock.id}
                      onOpen={() => setEditingBlock(heroBlock.id)}
                    />
                  )}

                  {/* The outline holds only the sections below the hero. */}
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
                      <BlockSortableList ids={editableBlocks.map(b => b.id)}>
                        {editableBlocks.map((block, index) => (
                          <SortableBlockRow
                            key={block.id}
                            id={block.id}
                            index={index}
                            total={editableBlocks.length}
                            label={getBlockLabel(block.type)}
                            summary={getBlockSummary(block)}
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
                            // +1 for the hero, which moveBlock indexes past.
                            onMove={(from, to) => moveBlock(currentPage.slug, from + 1, to + 1)}
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

                  {editableBlocks.length === 0 && (
                    <p className="mt-3 text-center text-[13px] text-[var(--ink-3)]">
                      Siden har kun heroen. Klik på &quot;Tilføj sektion&quot; for at
                      komme i gang.
                    </p>
                  )}
                  </div>
                </div>
                </div>

                {showPreview && (
                  /* The preview owns its own width now, so that dragging its
                     divider resizes the column instead of fighting a fixed
                     Tailwind width set here. Full width on small screens,
                     where the outline is hidden anyway. */
                  <div className="min-h-0 w-full shrink-0 lg:w-auto">
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
                        Anvend
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowComponentPicker(false)}>
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreatePage(false)}>
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBlockDeleteConfirm(null)}>
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
              // the panel so it commits with "Anvend" like every other field.
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupport(false)}>
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

function BlockEditModal({ block, onClose, onSave, onOpenMediaPicker, updateLocalContentRef }: { block: CMSBlock; onClose: () => void; onSave: (content: Record<string, any>) => void; onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void; updateLocalContentRef?: React.MutableRefObject<((fieldKey: string | null, url?: string) => void) | null> }) {
  const [localContent, setLocalContent] = useState(block.content || {})
  const mediaPickerOpenRef = useRef(false)

  // The block's own declaration of its fields. Read here rather than passed in
  // so the editor cannot be shown for a type that has no definition, which would
  // render an empty panel with no way to tell that something is wrong.
  const blockDefinition = getBlockDefinition(block.type)

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
          {/* The level comes first: it decides the height, the title size and
              whether the chevron and stats are there, so choosing it before the
              copy is the order that avoids redoing the rest. */}
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium leading-none text-[var(--ink-2)]">
              Effekt
            </legend>
            <div className="grid gap-2">
              {HERO_IMPACT_ORDER.map(level => {
                const option = HERO_IMPACTS[level]
                const selected = heroImpact(localContent) === level
                return (
                  <label
                    key={level}
                    className={cx(
                      'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--accent)]'
                    )}
                  >
                    <input
                      type="radio"
                      name="hero-impact"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setLocalContent(applyHeroImpact(localContent, level))}
                    />
                    {/* The dot stands in for the radio input, which is hidden to
                        keep the whole card clickable. */}
                    <span
                      aria-hidden
                      className={cx(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        selected
                          ? 'border-[var(--accent)]'
                          : 'border-[var(--hairline-strong)]'
                      )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-[var(--ink)]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-[var(--ink-3)]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

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
            <label className="block text-[13px] font-medium leading-none text-[var(--ink-2)]">Kompetencer</label>
            {/* Stored as a plain string and split on commas and newlines by the
                hero, so the editor can type a natural list rather than learn a
                repeater for a field that is only ever read once. */}
            <textarea
              value={
                Array.isArray(localContent.capabilities)
                  ? localContent.capabilities.join(', ')
                  : localContent.capabilities || ''
              }
              onChange={e =>
                setLocalContent({ ...localContent, capabilities: e.target.value })
              }
              rows={2}
              className="admin-input"
              placeholder="Webdesign, Webshop, SEO, Meta Ads"
            />
            <p className="mt-1.5 text-[12px] leading-snug text-[var(--ink-3)]">
              Adskil med komma. Vises som en linje under knapperne og er det, der
              gør heroen til et webbureau frem for en påstand.
            </p>
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
                      aria-label="Vælg baggrundsbillede"
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
                      aria-label="Vælg baggrundsvideo"
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

      {/* Every other block is generated from lib/blocks.ts.
          The hero keeps its bespoke editor above because its impact levels and
          background controls do not fit the generic field vocabulary. */}
      {blockDefinition && !blockDefinition.bespokeEditor && (
        <BlockFieldEditor
          definition={blockDefinition}
          content={localContent}
          onChange={patch => setLocalContent(prev => ({ ...prev, ...patch }))}
          onOpenMediaPicker={handleMediaClick}
        />
      )}

      {/* Enter in any field applies, matching the footer button. */}
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
            Anvend
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * A meta field with its length budget shown.
 *
 * The signal is on the field's border as well as in the counter, because an 11px
 * label is easy to miss while typing and the border is what the eye is already
 * on. The border colour is set by an attribute selector in admin.css rather than
 * by a utility class: `.admin-input` carries its own border, and a same-weight
 * utility would lose to it or win depending on which stylesheet loaded first.
 *
 * The limits and the states themselves live in ./seo-budget, shared with the
 * dashboard so one page cannot be "good" in the modal and "short" on the
 * dashboard.
 */
function MetaField({
  id,
  label,
  value,
  onChange,
  limit,
  placeholder,
  rows,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  limit: number
  placeholder?: string
  /** A textarea of this height when given, a single-line input otherwise. */
  rows?: number
}) {
  const state = budgetState(value.length, limit)
  // An untouched field says nothing here; the dashboard is where a missing meta
  // description is worth reporting.
  const note = state === 'empty' ? null : budgetLabel(state, value.length, limit)

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="block text-[13px] font-medium leading-none text-[var(--ink-2)]"
        >
          {label}
        </label>
        <span
          // Not a live region: it would read every keystroke back while typing.
          // The word beside the number carries the state instead.
          title={`Google bruger omkring ${limit} tegn`}
          className={`flex shrink-0 items-baseline gap-1.5 text-[11px] ${BUDGET_TONE[state]}`}
        >
          <span className="admin-num">
            {value.length} / {limit}
          </span>
          {note && <span className="font-medium">{note}</span>}
        </span>
      </div>

      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="admin-input"
          data-budget={state}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="admin-input"
          data-budget={state}
          placeholder={placeholder}
        />
      )}
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
          <MetaField
            id="meta-title"
            label="Meta Titel"
            value={metaTitle}
            onChange={setMetaTitle}
            limit={META_TITLE_LIMIT}
            placeholder={`${page.title} | StayMain`}
          />
          <MetaField
            id="meta-description"
            label="Meta Beskrivelse"
            value={metaDescription}
            onChange={setMetaDescription}
            limit={META_DESCRIPTION_LIMIT}
            placeholder="Kort beskrivelse af siden..."
            rows={4}
          />
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
                  {/* The same host the sitemap submits, so what an editor is shown
                      here is what Google will be sent. */}
                  {new URL(SITE_URL).host}
                  {slug === 'home' ? '' : `/${slug}`}
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
            Anvend
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
            Anvend
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
              {/* Keeps "Gem ændringer" while every other modal says "Anvend",
                  because this one really does write: users go straight to
                  /api/users and are outside the draft entirely. A save button
                  cannot un-create an account, so nothing here waits for one. */}
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      setImage((await uploadMediaFile(file)).url)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Uploaden mislykkedes')
    }
    setUploading(false)
  }

  const handleSave = () => {
    onSave({ title, image, link: link || undefined })
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
            {uploadError && (
              <div className="mt-3">
                <UploadErrorNote message={uploadError} onDismiss={() => setUploadError(null)} />
              </div>
            )}
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
              Anvend
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      setImage((await uploadMediaFile(file)).url)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Uploaden mislykkedes')
    }
    setUploading(false)
  }

  const handleSave = () => {
    onSave({ name, role, content, image })
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
            {uploadError && (
              <div className="mt-3">
                <UploadErrorNote message={uploadError} onDismiss={() => setUploadError(null)} />
              </div>
            )}
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
              Anvend
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  // Multi-select for bulk delete. A Set of file names, because that is the
  // identifier the delete API takes - keying on the rendered index would
  // re-point at a different file whenever the list is filtered or re-sorted.
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    const failures: string[] = []

    for (let i = 0; i < fileList.length; i++) {
      try {
        newFiles.push(await uploadMediaFile(fileList[i]))
      } catch (error) {
        console.error('Error uploading file:', error)
        failures.push(
          `${fileList[i].name}: ${error instanceof Error ? error.message : 'mislykkedes'}`
        )
      }
    }

    if (failures.length) setUploadError(failures.join('\n'))

    setFiles(prev => [...newFiles, ...prev])
    setUploading(false)
    e.target.value = ''
  }

  /**
   * Deletes the given files, and reports anything that survived.
   *
   * Selection is dropped for every name the API confirmed, and kept for the
   * rest, so a partial failure leaves the still-present files selected and
   * obvious rather than silently absent from the grid.
   */
  const runDelete = async (fileNames: string[]) => {
    setDeleting(true)
    try {
      const { deleted, failed } = await deleteMediaFiles(fileNames)

      setFiles(prev => prev.filter(f => !deleted.includes(f.name)))
      setSelected(prev => {
        const next = new Set(prev)
        for (const name of deleted) next.delete(name)
        return next
      })

      if (failed.length) {
        setUploadError(
          `Kunne ikke slette ${failed.length} fil(er):\n` +
            failed.map(f => `${f.file}: ${f.error}`).join('\n')
        )
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      setUploadError(error instanceof Error ? error.message : 'Kunne ikke slette filerne.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const toggleSelected = (fileName: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(fileName)) next.delete(fileName)
      else next.add(fileName)
      return next
    })
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

  // "Select all" acts on what is on screen, not on the whole library, so it
  // stays truthful when a filter or a search is narrowing the grid.
  const selectedOnScreen = displayedFiles.filter(f => selected.has(f.name))
  const allOnScreenSelected =
    displayedFiles.length > 0 && selectedOnScreen.length === displayedFiles.length
  const someOnScreenSelected =
    selectedOnScreen.length > 0 && selectedOnScreen.length < displayedFiles.length

  const toggleAllOnScreen = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allOnScreenSelected) {
        for (const f of displayedFiles) next.delete(f.name)
      } else {
        for (const f of displayedFiles) next.add(f.name)
      }
      return next
    })
  }

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
      {uploadError && <UploadErrorNote message={uploadError} onDismiss={() => setUploadError(null)} />}
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
          {displayedFiles.length > 0 && (
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-[13px] text-[var(--ink-2)]">
              <input
                type="checkbox"
                // A real tri-state rather than a checked prop that lies: with
                // some-but-not-all selected the box has to read as
                // indeterminate, or "select all" looks already done.
                ref={el => {
                  if (el) el.indeterminate = someOnScreenSelected
                }}
                checked={allOnScreenSelected}
                onChange={toggleAllOnScreen}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              Vælg alle
            </label>
          )}
          <span className="admin-num text-[11px] text-[var(--ink-3)]">
            {displayedFiles.length}
            {search ? ` af ${files.length}` : ''} filer
          </span>
          {uploadLabel(uploading ? 'Uploader…' : 'Upload filer')}
        </div>
      </div>

      {/* Only present once something is selected, so the destructive action is
          never one stray click away on a screen where nothing is picked. */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Valgte filer"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3.5 py-2.5"
        >
          <p className="text-[13px] font-medium text-[var(--ink)]">
            {/* "valgt" agrees with the count: 1 valgt fil, 3 valgte filer. */}
            {selected.size === 1 ? '1 valgt fil' : `${selected.size} valgte filer`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={deleting}
              className="inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              Ryd valg
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(Array.from(selected))}
              disabled={deleting}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[var(--danger)] px-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Trash2 size={13} />
              Slet valgte
            </button>
          </div>
        </div>
      )}

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
        <div
          data-media-grid=""
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {displayedFiles.map((file, index) => {
            const isSelected = selected.has(file.name)
            return (
            <div
              key={`${file.name}-${index}`}
              data-media-item={file.name}
              className={cx(
                'group relative overflow-hidden rounded-lg border bg-[var(--surface)] transition-colors',
                isSelected
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
              )}
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

                {/* The select control sits opposite the action buttons so the
                    two never overlap: both are in the thumbnail's top corners. */}
                <label
                  className={cx(
                    'absolute left-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-[var(--surface)]/90 backdrop-blur transition-opacity focus-within:opacity-100',
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(file.name)}
                    aria-label={`Vælg ${file.name}`}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                  />
                </label>

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
                      onClick={() => setConfirmDelete([file.name])}
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
            )
          })}
        </div>
      )}

      {/* Confirmation before anything is destroyed. Names the count and, for a
          bulk delete, that it is several files - a single "are you sure" for an
          unknown number of files is how a library gets emptied by accident. */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-delete-title"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--hairline)] bg-[var(--surface)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)]">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger-soft)]">
                <Trash2 size={32} className="text-[var(--danger)]" />
              </div>
              <h3 id="media-delete-title" className="mb-2 text-lg font-semibold text-[var(--ink)]">
                {confirmDelete.length === 1
                  ? 'Slet fil?'
                  : `Slet ${confirmDelete.length} filer?`}
              </h3>
              <p className="text-[var(--ink-2)]">
                {confirmDelete.length === 1
                  ? 'Er du sikker på at du vil slette denne fil? Denne handling kan ikke fortrydes.'
                  : `Er du sikker på at du vil slette ${confirmDelete.length} filer? Denne handling kan ikke fortrydes. Filer, der bruges på sitet, holder op med at virke.`}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={() => runDelete(confirmDelete)}
                disabled={deleting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--danger)] px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? 'Sletter…' : 'Slet'}
              </button>
            </div>
          </div>
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

function UploadErrorNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      data-upload-error=""
      className="flex items-start gap-2.5 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3.5 py-2.5"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <p className="flex-1 whitespace-pre-line text-[13px] leading-relaxed text-[var(--danger)]">
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Luk fejl"
        className="shrink-0 text-[var(--danger)] opacity-70 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function MediaPickerModal({ onSelect, onClose, filter: initialFilter }: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(initialFilter || 'image')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
    setUploadError(null)
    try {
      // This one had no Authorization header, so the API answered 401 and the
      // handler read `data.file` off the error body and did nothing at all.
      const uploaded = await uploadMediaFile(file)
      setFiles(prev => [uploaded, ...prev])
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Uploaden mislykkedes')
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
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
          {uploadError && (
            <div className="mb-3">
              <UploadErrorNote message={uploadError} onDismiss={() => setUploadError(null)} />
            </div>
          )}
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const handleSave = () => {
    onSave({ name, image, website: website || undefined })
    onClose()
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      setImage((await uploadMediaFile(file)).url)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Uploaden mislykkedes')
    }
    setUploading(false)
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
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
            {uploadError && (
              <div className="mt-3">
                <UploadErrorNote message={uploadError} onDismiss={() => setUploadError(null)} />
              </div>
            )}
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
              Anvend
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

/**
 * The CMS home.
 *
 * This used to redirect to `/admin/sider` on mount, which meant logging in sent
 * you out of the address you asked for and left a page of nothing in the history
 * where `/admin` used to be. It renders the workspace now, opening on the
 * dashboard.
 */
export default function AdminPage() {
  return <AdminWorkspace initialView="home" />
}
