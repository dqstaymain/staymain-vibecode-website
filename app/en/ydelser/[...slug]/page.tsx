import CMSPage from '@/components/CMSPage'

// Next.js 16 removed synchronous `params` access; it is always a Promise now.
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CMSPage slug={`ydelser/${slug}`} />
}
