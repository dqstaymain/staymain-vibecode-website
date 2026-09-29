import { notFound } from 'next/navigation'
import { AdminWorkspace } from '@/app/admin/page'
import { isAdminSection } from '@/app/admin/sections'

/**
 * Every content section, addressed by URL.
 *
 * One catch-all rather than a folder per section: the sections are screens
 * inside one component, and the alternative was eight near-identical files that
 * all did the same thing. The segment is validated, so an unknown one is a 404
 * rather than a blank canvas.
 *
 * Static routes win over this in Next's routing, so /admin/sider and
 * /admin/login are unaffected.
 */
export default async function AdminSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  if (!isAdminSection(section)) notFound()
  return <AdminWorkspace initialView={section} />
}
