'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import type { SectionTone } from '@/lib/blocks'

/**
 * The furniture every block shares.
 *
 * The blocks used to each roll their own section, container and heading, which
 * is how three of them ended up with different greys and four different values
 * of vertical padding. These exist so the only way to render a block's frame is
 * the same way for all of them.
 */

export function BlockSection({
  tone = 'light',
  tight,
  flush,
  narrow,
  children,
  className = '',
  ...rest
}: {
  tone?: SectionTone
  /** Reduced vertical padding, for a band that follows a heading. */
  tight?: boolean
  /** No vertical padding; the band's colour does the separating. */
  flush?: boolean
  /** Narrower measure, for a single idea. */
  narrow?: boolean
  children: ReactNode
  className?: string
  [key: string]: unknown
}) {
  const toneClass =
    tone === 'dark' ? 'blk--dark' : tone === 'muted' ? 'blk--muted' : 'blk--light'

  return (
    <section
      className={[
        'blk',
        toneClass,
        tight && 'blk--tight',
        flush && 'blk--flush',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className={narrow ? 'blk__inner blk__inner--narrow' : 'blk__inner'}>{children}</div>
    </section>
  )
}

/**
 * Eyebrow, heading and lede, centred or left.
 *
 * Rendered only when there is something to say in each slot, so a section with
 * no heading does not get a stray empty element holding its spacing. Headings
 * are set in the sans face with balanced wrapping, in the Codex manner — the
 * serif stays reserved for the brand voice outside `section.blk`.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  center,
  headingLevel = 2,
  className = '',
}: {
  eyebrow?: string
  title?: string
  description?: string
  center?: boolean
  headingLevel?: 2 | 3
  className?: string
}) {
  if (!eyebrow && !title && !description) return null

  // Sections after the hero are h2s. A block that may be used as a subsection
  // can ask for an h3, but defaulting to h3 everywhere would break the
  // document outline, since these are top-level page sections.
  const Heading = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3'

  return (
    <header className={['blk-head', center && 'blk-head--center', className].filter(Boolean).join(' ')}>
      {eyebrow && <span className="blk-eyebrow">{eyebrow}</span>}
      {title && <Heading className="blk-title">{title}</Heading>}
      {description && (
        <p className="blk-lede">
          {splitParagraphs(description).map((para, i) => (
            <span key={i} className="block">
              {para}
            </span>
          ))}
        </p>
      )}
    </header>
  )
}

/**
 * Splits blank-line separated text into paragraphs.
 *
 * A textarea cannot hold rich text without pulling in an editor dependency, so
 * paragraph structure is expressed as blank lines and turned into real
 * elements here. Doing it in the renderer rather than with `whitespace-pre-line`
 * is what lets the lede and the body scale differently and keep real spacing.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

/** Body copy with the same paragraph treatment. */
export function Prose({ text, className = '' }: { text?: string; className?: string }) {
  const paragraphs = splitParagraphs(text || '')
  if (!paragraphs.length) return null
  return (
    <div className={['blk-prose', className].filter(Boolean).join(' ')}>
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}

/**
 * Fades a block in the first time it scrolls into view.
 *
 * This starts at opacity 0, which makes the animation a liability: if the
 * observer never fires, the content is not merely un-animated, it is invisible.
 * That is not hypothetical - a fast scroll or a browser that delivers the
 * scroll before the observer is attached left whole sections permanently at
 * opacity 0, so the page had blank bands where copy and images should have been.
 *
 * So visibility does not depend on the observer succeeding. Three independent
 * paths reveal the node:
 *   1. it is already in view when the effect runs,
 *   2. the observer sees it enter,
 *   3. a timer reveals it regardless, so the worst case is "no animation".
 *
 * The third is the one that matters. A missing entrance animation is a cosmetic
 * fault; missing content is not.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section'
}) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Declared up front and mutated in place. Reveal is called from the
    // mount-time check below, which runs before the observer and the timer
    // exist - referencing either from inside it at that point would throw a
    // temporal dead zone error and leave the node at opacity 0.
    let observer: IntersectionObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    const reveal = () => {
      if (node.classList.contains('is-in')) return
      node.classList.add('is-in')
      observer?.disconnect()
      if (timer) clearTimeout(timer)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal()
        }
      },
      // A generous margin so a block that is nearly on screen still counts as
      // having arrived, rather than needing its first pixel inside the viewport.
      { rootMargin: '120px 0px -40px 0px', threshold: 0.01 }
    )

    observer.observe(node)

    // Anything already on screen at mount is not arriving, it has arrived.
    // Without this, a block that renders below a tall hero is watched for an
    // intersection the browser may already have decided about.
    if (node.getBoundingClientRect().top < window.innerHeight) reveal()

    // Last resort. Short enough that a missed observer reads as "no animation"
    // rather than as a delay, and it runs whether or not anything was scrolled.
    timer = setTimeout(reveal, 1200)

    return () => {
      observer?.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={['reveal', className].filter(Boolean).join(' ')}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

/** Filled / ghost button pair, matching the site's existing pill buttons. */
export function BlockActions({
  primary,
  secondary,
  center,
  className = '',
}: {
  primary?: { text?: string; href?: string }
  secondary?: { text?: string; href?: string }
  center?: boolean
  className?: string
}) {
  const hasPrimary = Boolean(primary?.text && primary?.href)
  const hasSecondary = Boolean(secondary?.text && secondary?.href)
  if (!hasPrimary && !hasSecondary) return null

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-3',
        center && 'justify-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasPrimary && (
        <a href={primary!.href} className="blk-btn blk-btn--primary">
          {primary!.text}
        </a>
      )}
      {hasSecondary && (
        <a href={secondary!.href} className="blk-btn blk-btn--ghost">
          {secondary!.text}
        </a>
      )}
    </div>
  )
}

/**
 * An image, or a neutral placeholder when none is set.
 *
 * Plain `<img>` rather than next/image: these URLs come from the CMS media
 * library and from uploaded files of unknown dimensions, and next/image's
 * layout requirements need a measured parent. `loading="lazy"` keeps the cost
 * off the critical path for everything below the fold.
 */
export function BlockImage({
  src,
  alt,
  ratio = 'landscape',
  className = '',
}: {
  src?: string
  alt?: string
  ratio?: 'portrait' | 'landscape' | 'square'
  className?: string
}) {
  const ratioClass =
    ratio === 'portrait' ? 'blk-media--portrait' : ratio === 'square' ? 'blk-media--square' : 'blk-media--landscape'

  if (!src) {
    return (
      <div className={['blk-media', ratioClass, className].filter(Boolean).join(' ')} aria-hidden="true">
        <div className="absolute inset-0 grid place-items-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className={['blk-media', ratioClass, className].filter(Boolean).join(' ')}>
      <img src={src} alt={alt || ''} loading="lazy" decoding="async" />
    </div>
  )
}

/** Inline SVG arrow, sized to sit beside a button label. */
export function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
