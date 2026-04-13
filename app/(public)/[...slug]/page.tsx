'use client'

import CMSPage from '@/components/CMSPage'

export default function DynamicPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  return <CMSPage slug={slug} />
}
