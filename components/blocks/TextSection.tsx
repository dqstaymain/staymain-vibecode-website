'use client'

import {
  BlockActions,
  BlockSection,
  Prose,
  SectionHeader,
} from '@/components/blocks/primitives'
import type { SectionTone } from '@/lib/blocks'

/**
 * Plain prose, optionally led by a heading and a pair of links.
 *
 * `measure` is an editor decision rather than a fixed guess: a single idea
 * reads badly at 80rem, and a wall of text reads worse in a narrow column.
 */
export function TextSection({ content }: { content?: Record<string, any> }) {
  const tone = (content?.tone as SectionTone) || 'light'
  const center = content?.align === 'center'
  const narrow = content?.measure !== 'wide'

  return (
    <BlockSection tone={tone} narrow={narrow}>
      <SectionHeader
        eyebrow={content?.eyebrow}
        title={content?.title}
        description={content?.description}
        center={center}
      />
      {content?.body && <Prose text={content.body} className={center ? 'text-center' : ''} />}
      <BlockActions
        center={center}
        className="mt-9"
        primary={{ text: content?.buttonText, href: content?.buttonLink }}
        secondary={{ text: content?.button2Text, href: content?.button2Link }}
      />
    </BlockSection>
  )
}
