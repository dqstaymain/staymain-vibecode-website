'use client'

import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Transform } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cx } from './ui'

/**
 * `distance: 6` is load-bearing. A sensor that activates on zero movement eats
 * the click that opens the block editor, because the click fires on the row the
 * handle sits inside. 6px is below the threshold for "the user meant to drag".
 */
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Space picks up, arrows move, Space drops, Esc cancels.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
}

export function sortTransform(transform: Transform | null): string | undefined {
  return transform ? CSS.Transform.toString(transform) : undefined
}

/**
 * The 2px gap marker. Rendering it *inside* the row it points at (rather than as
 * a separate list element) keeps it aligned no matter how the row resizes.
 */
export function InsertionLine({ show, side }: { show: boolean; side: 'top' | 'bottom' }) {
  if (!show) return null
  return (
    <span
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute inset-x-0 z-20 h-0.5 rounded-full bg-[var(--accent)]',
        side === 'top' ? '-top-0.5' : '-bottom-0.5'
      )}
    >
      <span className="absolute -top-[3px] h-2 w-2 rounded-full bg-[var(--accent)]" />
    </span>
  )
}

/**
 * The real drag activator. Previously the grip was `aria-hidden` decoration while
 * the entire row was draggable, so the handle actively lied about what it did.
 */
export function DragHandle({
  listeners,
  attributes,
  setActivatorNodeRef,
  label,
  className,
}: {
  listeners?: Record<string, any>
  attributes?: Record<string, any>
  setActivatorNodeRef?: (node: HTMLElement | null) => void
  label: string
  className?: string
}) {
  return (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      // Explicit label rather than an sr-only span: the visible content is an
      // icon, and this is what assistive tech and the tests both read.
      aria-label={label}
      title={label}
      className={cx(
        // touch-none stops the browser scrolling instead of starting a drag.
        'flex h-7 w-7 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-2)] active:cursor-grabbing',
        className
      )}
    >
      <GripVertical size={15} aria-hidden="true" />
    </button>
  )
}

/** A pill that tells the user what will happen if they drop here. */
export function DropHint({ children }: { children: ReactNode }) {
  return (
    <span className="admin-eyebrow pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 rounded bg-[var(--accent)] px-2 py-1 text-center text-[10px] text-white">
      {children}
    </span>
  )
}
