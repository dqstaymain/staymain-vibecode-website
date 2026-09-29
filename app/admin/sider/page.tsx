import { AdminWorkspace } from '@/app/admin/page'

/**
 * The page library.
 *
 * The list itself is drawn by the workspace, which also owns the auth gate and
 * the rail. This route exists so the library has an address of its own: it is
 * where the rail's "Sider" item goes, and what a shared link should point at.
 * It used to be a separate screen with its own header and its own copy of the
 * session check, which meant arriving here dropped the rail and the save control.
 */
export default function SiderPage() {
  return <AdminWorkspace initialView="sider" />
}
