'use client'

import { useCMS, CMSBlock } from '@/lib/cms'
import { BlockRenderer } from '@/components/BlockRenderer'
import SEOMeta from '@/components/SEOMeta'
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
      {page.blocks.map((block: CMSBlock) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  )
}
