import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NavItem } from '@/lib/cms'
import { cx } from './ui'
import { SortableNavRowShell } from './dnd-items'
import {
  flattenNav,
  resolveNavDrop,
  rebuildNavTree,
  navRowId,
  navPathOf,
  type FlatNavItem,
} from '@/lib/nav-tree'
import type { NavDropPlan } from './page'

/**
 * Renders the menu as one flat list with indentation, the way WordPress does.
 *
 * Nesting is expressed by `depth` rather than by nested containers. That is what
 * lets left/right dragging move an item between levels: every row is already in
 * one list, so changing its depth is all that is needed.
 */
export function SortableNavList({
  flat,
  drop,
  draggedPath,
  onOpen,
  onDelete,
  onAddChild,
  onPromote,
  onMakeDropdown,
}: {
  flat: FlatNavItem[]
  /** Outcome of the drag in progress: a landing gap, a refusal, or nothing. */
  drop: NavDropPlan
  draggedPath: string | null
  onOpen: (id: string) => void
  onDelete: (item: NavItem) => void
  onAddChild: (parentId: string) => void
  onPromote: (id: string) => void
  onMakeDropdown: (item: NavItem) => void
}) {
  return (
    <ul className="space-y-1.5">
      {flat.map(row => {
        const isDragged = row.path === draggedPath
        const side = drop.kind !== 'none' && drop.path === row.path ? drop.side : null
        const blocked = drop.kind === 'blocked' && drop.path === row.path

        return (
          <SortableNavRowShell
            key={row.path}
            id={navRowId(row.path)}
            label={`Flyt ${row.item.label}, niveau ${row.depth}`}
            dropSide={side}
            blocked={drop.kind === 'blocked' && drop.path === row.path}
            isDragging={isDragged}
            isDropTarget={side !== null}
          >
            {handle => (
              <div
                className={cx(
                  'flex items-center gap-2 rounded-lg border bg-[var(--surface)] py-2 pr-2 transition-colors',
                  // Indentation is the only depth cue, matching WordPress.
                  row.depth > 0 && 'ml-6 border-l-2 border-l-[var(--hairline-strong)]',
                  side !== null && 'border-[var(--accent-line)]',
                  blocked && 'border-[var(--danger)] bg-[var(--danger-soft)]',
                  side === null && !blocked &&
                    'border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
                )}
              >
                {handle}

                <span className="flex min-w-0 flex-1 items-center gap-2 py-0.5">
                  <span className="admin-num w-4 shrink-0 text-right text-[10px] text-[var(--ink-3)]">
                    {row.depth}
                  </span>
                  <span className="truncate text-[13px] font-medium text-[var(--ink)]">
                    {row.item.label}
                  </span>
                  <span className="truncate text-[12px] text-[var(--ink-3)]">
                    {row.item.pageSlug
                      ? `Side: ${row.item.pageSlug}`
                      : row.item.href || 'Ingen link'}
                  </span>
                  {row.item.children?.length ? (
                    <span className="shrink-0 rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] text-[var(--ink-2)]">
                      {row.item.children.length}
                    </span>
                  ) : null}
                </span>

                <span className="flex shrink-0 items-center gap-0.5">
                  {row.depth > 0 && (
                    <NavAction
                      title="Gør til almindeligt link"
                      label={`Fjern ${row.item.label} som underpunkt`}
                      onClick={() => onPromote(row.item.id)}
                    >
                      <ArrowLeft size={14} />
                    </NavAction>
                  )}
                  <NavAction
                    title="Tilføj underpunkt"
                    label={`Tilføj underpunkt til ${row.item.label}`}
                    onClick={() => onAddChild(row.item.id)}
                  >
                    <Plus size={14} />
                  </NavAction>
                  {/* Turning a link into a dropdown is an explicit click, not a
                      drag: the drag is only ever a reorder. */}
                  {row.depth === 0 && !row.item.children?.length && (
                    <button
                      type="button"
                      onClick={() => onMakeDropdown(row.item)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                    >
                      + Dropdown
                    </button>
                  )}
                  <NavAction
                    title="Rediger"
                    label={`Rediger ${row.item.label}`}
                    onClick={() => onOpen(row.item.id)}
                  >
                    <Pencil size={14} />
                  </NavAction>
                  <NavAction
                    title="Slet"
                    label={`Slet ${row.item.label}`}
                    onClick={() => onDelete(row.item)}
                    danger
                  >
                    <Trash2 size={14} />
                  </NavAction>
                </span>
              </div>
            )}
          </SortableNavRowShell>
        )
      })}
    </ul>
  )
}

function NavAction({
  title,
  label,
  onClick,
  danger,
  disabled,
  children,
}: {
  title: string
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      disabled={disabled}
      className={cx(
        'flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-2)] disabled:pointer-events-none disabled:opacity-30',
        danger && 'hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]'
      )}
    >
      {children}
    </button>
  )
}

export { flattenNav, resolveNavDrop, rebuildNavTree, navRowId, navPathOf }
export type { NavDropPlan }
export type { FlatNavItem }
