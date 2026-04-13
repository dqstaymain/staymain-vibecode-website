'use client'

import CMSPage from '@/components/CMSPage'

export default function YdelserSlug({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || ''
  return <CMSPage slug={`ydelser/${slug}`} />
}
