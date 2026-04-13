'use client'

import { useEffect } from 'react'
import { useCMS } from '@/lib/cms'

export default function SEOMeta({ slug }: { slug: string }) {
  const { pages } = useCMS()
  const page = pages.find(p => p.slug === slug)

  useEffect(() => {
    if (page?.meta) {
      if (page.meta.title) {
        document.title = page.meta.title
      }
      
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc && page.meta.description) {
        metaDesc.setAttribute('content', page.meta.description)
      }
    }
  }, [page?.meta])

  return null
}
