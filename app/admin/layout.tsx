import { CMSProvider } from '@/lib/cms'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CMSProvider>
      {children}
    </CMSProvider>
  )
}
