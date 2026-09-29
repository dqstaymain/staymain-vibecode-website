'use client'

import { BlockSection, Reveal, SectionHeader } from '@/components/blocks/primitives'
import type { SectionTone } from '@/lib/blocks'

/**
 * Proof points, set small and tabular.
 *
 * Numbers use tabular figures so multi-digit values align instead of jittering,
 * labels stay one short uppercase line, and a single hairline groups each pair.
 * No cards — four boxes would read as four unrelated objects.
 */
export function StatsSection({ content }: { content?: Record<string, any> }) {
  const tone = (content?.tone as SectionTone) || 'light'
  const items: any[] = Array.isArray(content?.items) ? content.items : []
  const ruled = content?.style !== 'plain'

  const columns = items.length <= 3 ? 'sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'

  return (
    <BlockSection tone={tone} tight>
      {(content?.eyebrow || content?.title || content?.description) && (
        <SectionHeader
          eyebrow={content?.eyebrow}
          title={content?.title}
          description={content?.description}
          center
          className="mb-12"
        />
      )}

      {items.length > 0 && (
        <dl className={`grid ${columns} gap-x-8 gap-y-8`}>
          {items.map((item, index) => (
            <Reveal
              key={item.id || `stat-${index}`}
              delay={index * 70}
              className={ruled ? 'blk-rule pt-5 text-center' : 'pt-5 text-center'}
            >
              <dt className="sr-only">{item.label || 'Statistik'}</dt>
              <dd>
                <span className="block text-[clamp(2rem,1.3rem+2.2vw,2.9rem)] font-semibold leading-none tracking-tight tabular-nums">
                  {item.number}
                </span>
                <span className="mt-2.5 block text-[0.75rem] font-medium uppercase tracking-[0.12em] opacity-60">
                  {item.label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      )}
    </BlockSection>
  )
}
