import CMSPage from '@/components/CMSPage'

export default function ServicePage({ params }: { params: { slug: string } }) {
  const slug = `ydelser/${params.slug}`
  return <CMSPage slug={slug} />
}
