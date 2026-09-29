'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import { Pencil, Trash2, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'
import { DragHandle, InsertionLine, sortTransform } from './dnd'
import { IconButton, cx } from './ui'

/**
 * The click that ends a pointer drag also lands on the row under the pointer,
 * which would open the block editor right after a reorder.
 *
 * A "was this a deliberate press?" flag is deterministic, unlike comparing
 * timestamps: arm it on mousedown, and disarm it the instant a drag starts.
 * A plain click consumes the flag; a drag never re-arms it.
 */
let rowPressArmed = false
export const armRowClick = () => {
  rowPressArmed = true
}
export const disarmRowClick = () => {
  rowPressArmed = false
}

/* ------------------------------------------------------------------ blocks */

export interface SortableBlockRowProps {
  id: string
  index: number
  total: number
  label: string
  summary: string
  icon: ReactNode
  isEditing: boolean
  /** Non-null when this row is the current drop gap. */
  dropSide: 'top' | 'bottom' | null
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onMove: (from: number, to: number) => void
}

export function SortableBlockRow({
  id,
  index,
  total,
  label,
  summary,
  icon,
  isEditing,
  dropSide,
  onOpen,
  onDelete,
  onMove,
}: SortableBlockRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const open = () => {
    if (!rowPressArmed) return
    rowPressArmed = false
    onOpen(id)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: sortTransform(transform), transition }}
      // Same reasoning as data-nav-row on the nav rows: gives a test a stable
      // handle on a block row without matching on its Danish label.
      data-block-row={id}
      className={cx('relative pl-9', isDragging && 'z-30 opacity-40')}
    >
      <InsertionLine show={dropSide === 'top'} side="top" />
      <InsertionLine show={dropSide === 'bottom'} side="bottom" />

      <div
        role="button"
        tabIndex={0}
        onMouseDown={armRowClick}
        onClick={open}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            rowPressArmed = true
            open()
          }
        }}
        className={cx(
          'group flex cursor-pointer items-center gap-3 rounded-md border py-2.5 pl-3 pr-2 transition-colors',
          isEditing
            ? 'border-[var(--accent-line)] bg-[var(--accent-soft)]'
            : 'border-transparent hover:border-[var(--hairline)] hover:bg-[var(--surface)]'
        )}
      >
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          setActivatorNodeRef={setActivatorNodeRef}
          label={`Flyt ${label}, position ${index + 1} af ${total}`}
          className="absolute left-0 top-1/2 -translate-y-1/2"
        />

        <span className="admin-num w-5 shrink-0 text-right text-[11px] text-[var(--ink-3)]">
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="shrink-0 text-[var(--ink-3)] group-hover:text-[var(--ink-2)]">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="admin-eyebrow block">{label}</span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--ink-2)]">{summary}</span>
        </span>

        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <IconButton label={`Rediger ${label}`} onClick={() => onOpen(id)}>
            <Pencil size={14} />
          </IconButton>
          <IconButton
            label={`Slet ${label}`}
            className="hover:text-[var(--danger)]"
            onClick={() => onDelete(id)}
          >
            <Trash2 size={14} />
          </IconButton>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            aria-label={`Flyt ${label} op`}
            title="Flyt op"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-2)] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            aria-label={`Flyt ${label} ned`}
            title="Flyt ned"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-2)] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        </span>
      </div>
    </div>
  )
}

export function BlockSortableList({
  ids,
  children,
}: {
  ids: string[]
  children: ReactNode
}) {
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

/* --------------------------------------------------------------- nav items */

export function SortableNavRow({
  id,
  index,
  total,
  children,
  dropSide,
  nestChildLabel,
}: {
  id: string
  index: number
  total: number
  children: (args: { handle: ReactNode; isDragging: boolean }) => ReactNode
  dropSide: 'top' | 'bottom' | null
  /** Label of the point about to be nested here, or null when not nesting. */
  nestChildLabel: string | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: sortTransform(transform), transition }}
      className={cx(
        'relative rounded-lg',
        nestChildLabel && 'ring-2 ring-[var(--accent)]',
        isDragging && 'z-30 opacity-40'
      )}
    >
      <InsertionLine show={dropSide === 'top'} side="top" />
      <InsertionLine show={dropSide === 'bottom'} side="bottom" />

      {/* Turning a link into a dropdown is the point of the gesture, so it gets
          named out loud. The row also visibly indents, because dnd-kit
          translates it by the pointer delta as it is dragged rightwards. */}
      {nestChildLabel && (
        <span className="admin-eyebrow pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 rounded bg-[var(--accent)] px-2 py-1 text-center text-[10px] text-white">
          {nestChildLabel}
        </span>
      )}

      {children({
        handle: (
          <DragHandle
            listeners={listeners}
            attributes={attributes}
            setActivatorNodeRef={setActivatorNodeRef}
            label={`Flyt menupunkt ${index + 1} af ${total}`}
          />
        ),
        isDragging,
      })}
    </div>
  )
}

/**
 * One sortable row of the flat menu list.
 *
 * `setNodeRef` has to land on the row element itself. Without it the row is
 * never registered as a droppable, so the drag silently does nothing: the
 * handle still gets its listeners and looks draggable, but there is no node to
 * measure and nothing to drop onto.
 */
export function SortableNavRowShell({
  id,
  label,
  dropSide,
  blocked,
  isDragging,
  isDropTarget,
  children,
}: {
  id: string
  label: string
  dropSide: 'top' | 'bottom' | null
  /** The drop is not allowed here; show that rather than nothing. */
  blocked: boolean
  isDragging: boolean
  isDropTarget: boolean
  children: (handle: ReactNode) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: sortTransform(transform), transition }}
      // Exposed as data attributes so a test can assert on the drop state
      // directly. Reading it back out of Tailwind class names is brittle and
      // cannot distinguish "no line" from "line with a different class".
      data-nav-row={id}
      data-nav-drop={dropSide ?? undefined}
      data-nav-blocked={blocked || undefined}
      data-nav-dragging={isDragging || undefined}
      className={cx('relative', isDragging && 'z-30 opacity-40')}
    >
      {dropSide === 'top' && (
        <span
          className={cx(
            'pointer-events-none absolute inset-x-0 -top-[3px] z-20 h-0.5 rounded-full',
            blocked ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
          )}
        />
      )}
      {dropSide === 'bottom' && (
        <span
          className={cx(
            'pointer-events-none absolute inset-x-0 -bottom-[3px] z-20 h-0.5 rounded-full',
            blocked ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
          )}
        />
      )}

      {children(
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          setActivatorNodeRef={setActivatorNodeRef}
          label={label}
        />
      )}
    </li>
  )
}

export function SortableNavChild({
  id,
  index,
  children,
  dropSide,
}: {
  id: string
  index: number
  children: (handle: ReactNode) => ReactNode
  dropSide: 'top' | 'bottom' | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: sortTransform(transform), transition }}
      className={cx('relative', isDragging && 'z-30 opacity-40')}
    >
      <InsertionLine show={dropSide === 'top'} side="top" />
      <InsertionLine show={dropSide === 'bottom'} side="bottom" />
      {children(
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          setActivatorNodeRef={setActivatorNodeRef}
          label={`Flyt underpunkt ${index + 1}`}
          className="h-6 w-6"
        />
      )}
    </div>
  )
}

export function NavChildSortableList({ ids, children }: { ids: string[]; children: ReactNode }) {
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

/* ------------------------------------------------------------- list end */

/**
 * Drop target for "move this block to the end". Its click opens the component
 * picker, so it is the only way to add a section.
 */
export function ListEndZone({
  isOver,
  onClick,
  children,
}: {
  isOver: boolean
  onClick: () => void
  children: ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: 'list-end' })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cx(
        'mt-3 cursor-pointer rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
        isOver
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--hairline-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]'
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ shared */

export function NavRowActions({
  onEdit,
  onDelete,
  onToggleDropdown,
  isDropdown,
}: {
  onEdit: () => void
  onDelete: () => void
  onToggleDropdown?: () => void
  isDropdown: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {onToggleDropdown && (
        <button
          type="button"
          onClick={onToggleDropdown}
          title={isDropdown ? 'Gør til almindeligt link' : 'Gør til dropdown'}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
        >
          {isDropdown ? '→ Link' : '+ Dropdown'}
        </button>
      )}
      <IconButton label="Rediger menupunkt" onClick={onEdit}>
        <Pencil size={14} />
      </IconButton>
      <IconButton
        label="Slet menupunkt"
        className="hover:text-[var(--danger)]"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </IconButton>
    </div>
  )
}

export function NavChildRowActions({
  onEdit,
  onPromote,
  onDelete,
}: {
  onEdit: () => void
  onPromote: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label="Rediger underpunkt" onClick={onEdit}>
        <Pencil size={13} />
      </IconButton>
      <IconButton label="Flyt til topniveau" onClick={onPromote}>
        <ExternalLink size={13} />
      </IconButton>
      <IconButton
        label="Slet underpunkt"
        className="hover:text-[var(--danger)]"
        onClick={onDelete}
      >
        <Trash2 size={13} />
      </IconButton>
    </div>
  )
}
