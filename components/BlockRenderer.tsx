'use client'

import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Testimonials from '@/components/Testimonials'
import CallToAction from '@/components/CallToAction'
import ContentImageBlock from '@/components/ContentImageBlock'
import type { CMSBlock } from '@/lib/cms'

/**
 * The single source of truth for how a CMS block becomes a section.
 *
 * Both the public site (components/CMSPage.tsx) and the admin's live preview
 * render through this, so the preview can never drift from what visitors see.
 */

const defaultStats = [
  { id: 'default-stat-0', number: '50+', label: 'Projekter' },
  { id: 'default-stat-1', number: '100%', label: 'Tilfredse' },
  { id: 'default-stat-2', number: '5+', label: 'Års erfaring' },
  { id: 'default-stat-3', number: '24/7', label: 'Support' },
]

const defaultGalleryItems = [
  { id: 'default-gallery-0', title: 'Projekt 1', category: 'Hjemmeside' },
  { id: 'default-gallery-1', title: 'Projekt 2', category: 'Webshop' },
  { id: 'default-gallery-2', title: 'Projekt 3', category: 'Meta Ads' },
]

export function BlockRenderer({
  block,
  onUnsupported,
}: {
  block: CMSBlock
  /** Preview-only: called for block types that have no public renderer. */
  onUnsupported?: (block: CMSBlock) => void
}) {
  switch (block.type) {
    case 'hero':
      return <Hero customContent={block.content} />
    case 'services':
      return <Services />
    case 'testimonials':
      return <Testimonials />
    case 'text':
      return <TextBlock content={block.content} />
    case 'cta':
      return <CTABlock content={block.content} />
    case 'stats':
      return <StatsBlock content={block.content} />
    case 'gallery':
      return <GalleryBlock content={block.content} />
    case 'contentImage':
      return <ContentImageBlock content={block.content} />
    default:
      // `contact` has no renderer, so it currently shows nothing on the public
      // site. The preview surfaces that instead of silently rendering blank.
      onUnsupported?.(block)
      return null
  }
}

export function hasRenderer(type: CMSBlock['type']) {
  return ['hero', 'services', 'testimonials', 'text', 'cta', 'stats', 'gallery', 'contentImage'].includes(type)
}

function TextBlock({ content }: { content?: Record<string, any> }) {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {content?.title && (
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            {content.title}
          </h2>
        )}
        {content?.body && (
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {content.body}
          </p>
        )}
      </div>
    </section>
  )
}

function CTABlock({ content }: { content?: Record<string, any> }) {
  return <CallToAction title={content?.title || 'Klar til at komme i gang?'} description={content?.description} />
}

function StatsBlock({ content = {} }: { content?: Record<string, any> }) {
  const stats = content && content.stats?.length > 0 ? content.stats : defaultStats

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, index: number) => (
            <div key={stat.id ?? `stat-${index}`} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-500 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-base text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GalleryBlock({ content = {} }: { content?: Record<string, any> }) {
  const items = content && content.items?.length > 0 ? content.items : defaultGalleryItems

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any, index: number) => (
            <div
              key={item.id ?? `gallery-${index}`}
              className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"
            >
              <span className="text-slate-400">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
