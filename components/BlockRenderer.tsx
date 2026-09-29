'use client'

import Hero from '@/components/Hero'
import { TextSection } from '@/components/blocks/TextSection'
import { ContentImageSection } from '@/components/blocks/ContentImageSection'
import { ServicesSection } from '@/components/blocks/ServicesSection'
import { TestimonialsSection } from '@/components/blocks/TestimonialsSection'
import { StatsSection } from '@/components/blocks/StatsSection'
import { GallerySection } from '@/components/blocks/GallerySection'
import { CtaSection } from '@/components/blocks/CtaSection'
import { ContactSection } from '@/components/blocks/ContactSection'
import { getBlockDefinition, normaliseBlockContent } from '@/lib/blocks'
import type { CMSBlock } from '@/lib/cms'

/**
 * The single source of truth for how a CMS block becomes a section.
 *
 * Both the public site (components/CMSPage.tsx) and the admin's live preview
 * render through this, so the preview can never drift from what visitors see.
 *
 * Every non-hero block is now rendered by a component under components/blocks,
 * all of which share the same section, heading and button primitives. Content is
 * normalised on the way in, so a block written by an older build - or one whose
 * repeater was never populated - still reaches its renderer in a usable shape
 * instead of rendering a blank band.
 */
export function BlockRenderer({ block }: { block: CMSBlock }) {
  // Normalising here rather than in each renderer means a section cannot be
  // handed a missing array or a select left on an invalid value.
  const content = normaliseBlockContent(block.type, block.content)

  switch (block.type) {
    case 'hero':
      return <Hero customContent={content} />
    case 'text':
      return <TextSection content={content} />
    case 'contentImage':
      return <ContentImageSection content={content} />
    case 'services':
      return <ServicesSection content={content} />
    case 'testimonials':
      return <TestimonialsSection content={content} />
    case 'stats':
      return <StatsSection content={content} />
    case 'gallery':
      return <GallerySection content={content} />
    case 'cta':
      return <CtaSection content={content} />
    case 'contact':
      return <ContactSection content={content} />
    default:
      // A type with no renderer. Every type in BLOCK_DEFINITIONS has one, so
      // this is only reachable for content saved before a block existed.
      return null
  }
}

/** Every block type the site can render. */
const RENDERERS: ReadonlySet<CMSBlock['type']> = new Set([
  'hero',
  'text',
  'contentImage',
  'services',
  'testimonials',
  'stats',
  'gallery',
  'cta',
  'contact',
])

export function hasRenderer(type: CMSBlock['type']): boolean {
  return RENDERERS.has(type) && Boolean(getBlockDefinition(type))
}
