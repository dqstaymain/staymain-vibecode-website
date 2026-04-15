'use client'

import { useCMS, CMSBlock } from '@/lib/cms'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Testimonials from '@/components/Testimonials'
import SEOMeta from '@/components/SEOMeta'
import CallToAction from '@/components/CallToAction'
import ContentImageBlock from '@/components/ContentImageBlock'
import Link from 'next/link'

export default function CMSPage({ slug }: { slug: string }) {
  const { pages, supabaseReady } = useCMS()
  const page = pages.find(p => p.slug === slug)

  if (!supabaseReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </main>
    )
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="pt-32 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="text-8xl font-bold text-blue-500 mb-4">404</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Side ikke fundet
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Den side du leder efter, eksisterer ikke eller er blevet flyttet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-colors"
            >
              Gå til forsiden
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <SEOMeta slug={slug} />
      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  )
}

function BlockRenderer({ block }: { block: CMSBlock }) {
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
      return null
  }
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

function StatsBlock({ content = {} }: { content?: Record<string, any> }) {
  const stats = content && content.stats?.length > 0 ? content.stats : defaultStats

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any) => (
            <div key={stat.id} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-500 mb-2">
                {stat.number}
              </div>
              <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
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
          {items.map((item: any) => (
            <div
              key={item.id}
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
