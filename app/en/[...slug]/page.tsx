'use client'

import CMSPage from '@/components/CMSPage'

export default function SlugPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || ''
  return <CMSPage slug={slug} />
}
