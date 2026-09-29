'use client'

import { BlockSection, SectionHeader } from '@/components/blocks/primitives'
import type { SectionTone } from '@/lib/blocks'

/**
 * The closing call to action.
 *
 * Centred, narrow and quiet: a balanced heading, one muted line, and a pill
 * row. Pills carry no arrow icons — at this size an arrow is decoration, and
 * the section already asks for exactly one decision.
 *
 * `style` defaults to light, including for blocks saved before the field
 * existed — previously those rendered dark. That flip is intentional: the
 * closing band is now quiet by default, and dark remains one click away.
 */
export function CtaSection({ content }: { content?: Record<string, any> }) {
  const style = content?.style === 'dark' ? 'dark' : 'light'
  const tone = style as SectionTone

  const primary = { text: content?.buttonText, href: content?.buttonLink }
  const secondary = { text: content?.button2Text, href: content?.button2Link }
  const hasButtons = (primary.text && primary.href) || (secondary.text && secondary.href)

  return (
    <BlockSection tone={tone} narrow>
      <div className="text-center">
        <SectionHeader
          eyebrow={content?.eyebrow}
          title={content?.title}
          description={content?.description}
          center
        />

        {hasButtons && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {primary.text && primary.href && (
              <a href={primary.href} className="blk-btn blk-btn--primary">
                {primary.text}
              </a>
            )}
            {secondary.text && secondary.href && (
              <a href={secondary.href} className="blk-btn blk-btn--ghost">
                {secondary.text}
              </a>
            )}
          </div>
        )}
      </div>
    </BlockSection>
  )
}
