import { CMSProvider } from '@/lib/cms'
import './admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CMSProvider>
      <div className="admin-shell min-h-screen">{children}</div>
    </CMSProvider>
  )
}
