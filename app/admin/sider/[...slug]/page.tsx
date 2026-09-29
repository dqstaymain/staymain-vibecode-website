import { AdminWorkspace } from '@/app/admin/page'

/**
 * The page editor, at its own URL.
 *
 * A server component because Next 16 removed synchronous `params`; it is always
 * a Promise now. A catch-all rather than `[slug]` because a nested page's slug
 * contains a slash (`ydelser/webshop`), which a single segment cannot match.
 *
 * The workspace is a client component, so awaiting here keeps params resolution
 * on the server where it belongs.
 */
export default async function SiderEditorRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const joined = slug.join('/')

  // "ny" is the create route. The dialog that creates the page lives in the
  // workspace, so it is opened from there rather than duplicated here.
  if (joined === 'ny') {
    return <AdminWorkspace startCreatingPage />
  }

  return <AdminWorkspace initialSlug={decodeURIComponent(joined)} />
}
