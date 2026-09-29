'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BlockSection, Reveal, SectionHeader } from '@/components/blocks/primitives'
import { useCMS } from '@/lib/cms'
import type { SectionTone } from '@/lib/blocks'

/**
 * Customer quotes.
 *
 * The quotes themselves stay in the Anmeldelser admin section - that is where
 * they are already written and where they will keep being written, and having
 * the same quote editable from two places is how the two drift apart. This block
 * owns presentation: the heading, the layout, and how many to show.
 */
export function TestimonialsSection({ content }: { content?: Record<string, any> }) {
  const { testimonials } = useCMS()
  const tone = (content?.tone as SectionTone) || 'light'
  const asGrid = content?.layout === 'grid'
  const [index, setIndex] = useState(0)

  const limit = Number(content?.limit) || 0
  const all = testimonials || []
  const items = (limit > 0 ? all.slice(0, limit) : all).map(t => ({
    id: t.id,
    quote: t.content,
    author: t.name,
    role: t.role,
  }))

  // The list can shrink under us if a testimonial is deleted elsewhere, which
  // would leave the slider parked on an index that no longer exists.
  useEffect(() => {
    if (index >= items.length) setIndex(0)
  }, [items.length, index])

  // Autoplay, suspended on hover and on focus, and skipped entirely when the
  // reader has asked for reduced motion - a carousel that moves on its own is
  // hostile to anyone reading it.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (asGrid || paused || items.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 7000)
    return () => clearInterval(id)
  }, [asGrid, paused, items.length])

  if (!items.length) {
    // An empty testimonials block is invisible rather than an empty band, and it
    // points at the section that actually holds the content.
    return (
      <BlockSection tone={tone} tight>
        <div className="blk-head blk-head--center">
          {content?.title && <h2 className="blk-title">{content.title}</h2>}
          <p className="blk-lede">
            Ingen anmeldelser endnu. Tilføj dem under Anmeldelser i menuen.
          </p>
        </div>
      </BlockSection>
    )
  }

  if (asGrid) {
    return (
      <BlockSection tone={tone}>
        <SectionHeader
          eyebrow={content?.eyebrow}
          title={content?.title}
          description={content?.description}
          center
          className="mb-12"
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id || `t-${i}`} delay={Math.min(i, 5) * 60}>
              <blockquote className="blk-card flex h-full flex-col p-5 sm:p-6">
                <p className="text-[0.9375rem] leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-4 text-[0.8125rem]">
                  <span className="font-semibold">{item.author}</span>
                  {item.role && <span className="opacity-60"> · {item.role}</span>}
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </BlockSection>
    )
  }

  const current = items[Math.min(index, items.length - 1)]

  return (
    <BlockSection tone={tone} narrow>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <SectionHeader
          eyebrow={content?.eyebrow}
          title={content?.title}
          description={content?.description}
          center
          className="mb-10"
        />

        <blockquote className="text-center">
          <p className="text-[clamp(1.15rem,0.95rem+0.9vw,1.5rem)] font-normal leading-[1.5] tracking-[-0.01em]">
            &ldquo;{current.quote}&rdquo;
          </p>
          <footer className="mt-6 text-[0.875rem]">
            <span className="font-semibold">{current.author}</span>
            {current.role && <span className="opacity-60"> · {current.role}</span>}
          </footer>
        </blockquote>

        {items.length > 1 && (
          <div className="mt-9 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setIndex(i => (i - 1 + items.length) % items.length)}
              aria-label="Forrige anmeldelse"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d8d5] transition-colors hover:border-slate-900 dark:border-white/20 dark:hover:border-white"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              {items.map((item, i) => (
                <button
                  key={item.id || `d-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Gå til anmeldelse ${i + 1}`}
                  aria-current={i === index}
                  className={[
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-slate-900 dark:bg-white' : 'w-1.5 bg-current opacity-25',
                  ].join(' ')}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIndex(i => (i + 1) % items.length)}
              aria-label="Næste anmeldelse"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d8d5] transition-colors hover:border-slate-900 dark:border-white/20 dark:hover:border-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </BlockSection>
  )
}
