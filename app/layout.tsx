import type { Metadata } from 'next'
import './globals.css'
import { CMSProvider } from '@/lib/cms'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'StayMain | Web Design Agency',
  description: 'Vi skaber digitale oplevelser, der tæller. StayMain er et dansk webbureau med fokus på moderne design og funktionalitet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <CMSProvider>
            {children}
          </CMSProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
