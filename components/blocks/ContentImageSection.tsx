'use client'

import { BlockActions, BlockImage, BlockSection, Prose, Reveal, SectionHeader } from '@/components/blocks/primitives'
import type { SectionTone } from '@/lib/blocks'

/**
 * Feature row: one part copy, two parts media.
 *
 * Text sits low beside the image rather than floating at its middle, so the
 * heading lands on the same baseline rhythm as the media's lower edge. Sides
 * alternate through `layout`, and the image is always landscape — a mixed bag
 * of tall portraits made neighbouring sections swing wildly in height.
 */
export function ContentImageSection({ content }: { content?: Record<string, any> }) {
  const tone = (content?.tone as SectionTone) || 'light'
  const imageLeft = content?.layout !== 'image-right'

  return (
    <BlockSection tone={tone}>
      <div className="grid items-end gap-x-12 gap-y-10 lg:grid-cols-3">
        <Reveal
          delay={60}
          className={imageLeft ? 'lg:order-2 lg:col-span-1' : 'lg:order-1 lg:col-span-1'}
        >
          <SectionHeader
            eyebrow={content?.eyebrow}
            title={content?.title}
            description={content?.description}
          />
          {content?.body && <Prose text={content.body} className="mt-5" />}
          <BlockActions
            className="mt-8"
            primary={{ text: content?.buttonText, href: content?.buttonLink }}
            secondary={{ text: content?.button2Text, href: content?.button2Link }}
          />
        </Reveal>

        <Reveal className={imageLeft ? 'lg:order-1 lg:col-span-2' : 'lg:order-2 lg:col-span-2'}>
          <BlockImage
            src={content?.image}
            alt={content?.imageAlt || content?.title}
            ratio="landscape"
            className="max-h-[30rem] w-full"
          />
        </Reveal>
      </div>
    </BlockSection>
  )
}

export { ArrowIcon } from '@/components/blocks/primitives'
