'use client'

/**
 * Admin UI primitives.
 *
 * Everything visual in the admin is composed from these so spacing, radius,
 * hairline weight and focus treatment stay consistent. Colours are driven by
 * the CSS custom properties in ./admin.css rather than Tailwind palette
 * classes, which keeps the whole surface on one token set.
 */

import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, useEffect, useRef } from 'react'
import { X, Plus, Inbox, AlertCircle } from 'lucide-react'

// The implementation moved to lib/cx because the public site needs it too, and
// a component under components/ should not reach into app/admin. Imported here
// as well as re-exported, because this file uses it internally and the other
// four files import it from here.
import { cx } from '@/lib/cx'
export { cx }

/* ---------------------------------------------------------------- Button -- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-md whitespace-nowrap ' +
  'transition-colors duration-100 disabled:opacity-45 disabled:pointer-events-none select-none'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // Primary is ink, not colour. Colour is reserved for selection state.
  primary: 'bg-[var(--ink)] text-[var(--surface)] hover:opacity-90',
  secondary:
    'bg-[var(--surface)] text-[var(--ink)] border border-[var(--hairline-strong)] hover:bg-[var(--surface-hover)]',
  ghost: 'text-[var(--ink-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]',
  danger:
    'bg-transparent text-[var(--danger)] border border-[var(--hairline-strong)] hover:bg-[var(--danger-soft)] hover:border-[var(--danger)]',
}

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button className={cx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)} {...props}>
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
        'text-[var(--ink-3)] transition-colors duration-100',
        'hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]',
        'disabled:opacity-40 disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------- Field -- */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium leading-none text-[var(--ink-2)]"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-snug text-[var(--ink-3)]">{hint}</p>}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('admin-input', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('admin-input resize-y leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  // The arrow and its padding come from `select.admin-input` in admin.css. Not
  // from `pr-8` here: that utility loses to the base class's padding, which is
  // what left this control with no visible indicator that it opens anything.
  return (
    <select className={cx('admin-input cursor-pointer appearance-none', className)} {...props}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[13px] text-[var(--ink-2)]"
    >
      <span
        className={cx(
          'relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-150',
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--hairline-strong)]'
        )}
      >
        <span
          className={cx(
            'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform duration-150',
            checked ? 'translate-x-[16px]' : 'translate-x-[2px]'
          )}
        />
      </span>
      {label}
    </button>
  )
}

/* --------------------------------------------------------------- Surfaces -- */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-lg border border-[var(--hairline)] bg-[var(--surface)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-tight text-[var(--ink)]">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Small structural heading used above groups inside a panel. */
export function GroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('admin-eyebrow', className)}>{children}</p>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'danger'
}) {
  const tones = {
    neutral: 'bg-[var(--surface-hover)] text-[var(--ink-2)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  }
  return (
    <span
      className={cx(
        'admin-num inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}

/* ----------------------------------------------------------- Empty/error -- */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--hairline-strong)] px-6 py-14 text-center">
      <div className="mb-3 text-[var(--ink-3)]">{icon ?? <Inbox size={22} />}</div>
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--ink-3)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2.5 text-[13px] text-[var(--danger)]">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span className="leading-snug">{children}</span>
    </div>
  )
}

/* ----------------------------------------------------------------- Modal -- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Prevent the page behind from scrolling while a dialog is open.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog so keyboard users aren't left behind it.
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cx(
          'relative z-10 my-auto w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface)]',
          'shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28)] outline-none',
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-[var(--ink)]">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-snug text-[var(--ink-3)]">{description}</p>
            )}
          </div>
          <IconButton label="Luk" onClick={onClose} className="-mr-1 -mt-1">
            <X size={16} />
          </IconButton>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- SlideOver -- */

/**
 * Contextual editor panel. Preferred over a modal for editing because the
 * object being edited stays visible behind it, so the relationship between
 * a block and its settings is never lost.
 */
export function SlideOver({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/25" onClick={onClose} aria-hidden="true" />
      <div
        className={cx(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-[var(--hairline)] bg-[var(--surface)]',
          'shadow-[-16px_0_48px_-24px_rgba(0,0,0,0.35)]',
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="admin-eyebrow mb-1.5">{eyebrow}</p>}
            <h2 className="text-sm font-semibold leading-tight text-[var(--ink)]">{title}</h2>
          </div>
          <IconButton label="Luk" onClick={onClose} className="-mr-1 -mt-1">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] bg-[var(--surface-sunken)] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Bits -- */

export function AddRowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--hairline-strong)]',
        'px-4 py-3 text-[13px] font-medium text-[var(--ink-2)]',
        'transition-colors duration-100 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
      )}
    >
      <Plus size={15} />
      {children}
    </button>
  )
}

/* ---------------------------------------------------------- SectionShell -- */

/**
 * Standard frame for a top-level admin section: a quiet header that states
 * where you are, and a scrolling body. Every section uses this so the canvas
 * has one consistent rhythm.
 */
export function SectionShell({
  eyebrow,
  title,
  meta,
  actions,
  children,
  width = 'max-w-3xl',
}: {
  eyebrow?: string
  title: string
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
  width?: string
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--surface)] px-6 py-3.5">
        <div className="min-w-0">
          {eyebrow && <p className="admin-eyebrow mb-1">{eyebrow}</p>}
          <h2 className="truncate text-[15px] font-semibold leading-tight text-[var(--ink)]">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {meta}
          {actions}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className={cx('mx-auto', width)}>{children}</div>
      </div>
    </>
  )
}

