'use client'

import { ArrowIcon, BlockImage, BlockSection, Reveal, SectionHeader } from '@/components/blocks/primitives'
import type { SectionTone } from '@/lib/blocks'

/**
 * Selected work, in one calm grid.
 *
 * Every tile shares the same 4:3 frame so the row edges stay straight no matter
 * how many cases are added — mixed portrait/landscape tiles made neighbouring
 * rows jump. The category, when set, sits beside the title as muted metadata
 * rather than as a badge competing with the image.
 */
export function GallerySection({ content }: { content?: Record<string, any> }) {
  const tone = (content?.tone as SectionTone) || 'light'
  const items: any[] = Array.isArray(content?.items) ? content.items : []

  const columns = items.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <BlockSection tone={tone}>
      <SectionHeader
        eyebrow={content?.eyebrow}
        title={content?.title}
        description={content?.description}
        center
        className="mb-12"
      />

      {items.length > 0 && (
        <div className={`grid gap-x-6 gap-y-10 ${columns}`}>
          {items.map((item, index) => {
            const tile = (
              <Reveal key={item.id || `gal-${index}`} delay={Math.min(index, 5) * 60}>
                <figure>
                  <BlockImage src={item.image} alt={item.title} ratio="landscape" />
                  <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="text-[0.9375rem] font-medium">
                      {item.title || 'Case'}
                    </span>
                    {item.category ? (
                      <span className="shrink-0 text-[0.8125rem] opacity-60">{item.category}</span>
                    ) : item.link ? (
                      <ArrowIcon className="shrink-0 opacity-50" />
                    ) : null}
                  </figcaption>
                </figure>
              </Reveal>
            )

            return item.link ? (
              <a
                key={item.id || `gal-${index}`}
                href={item.link}
                aria-label={item.title ? `Se casen ${item.title}` : 'Se casen'}
                className="group block rounded-xl transition-opacity hover:opacity-90"
              >
                {tile}
              </a>
            ) : (
              tile
            )
          })}
        </div>
      )}
    </BlockSection>
  )
}
