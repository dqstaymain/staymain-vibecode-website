import type { Metadata } from 'next'
import './globals.css'
import { CMSProvider } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'StayMain | Web Design Agency',
  description: 'Vi skaber digitale oplevelser, der tæller. StayMain er et dansk webbureau med fokus på moderne design og funktionalitet.',
}

// Runs before first paint so a dark-theme visitor never sees a white flash.
// Previously the class was only added in a post-hydration effect, which meant
// every cold load painted light and then snapped to dark.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('staymain_theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
<<<<<<< Updated upstream
        <ThemeProvider>
          <CMSProvider>
            {children}
          </CMSProvider>
        </ThemeProvider>
=======
        <LanguageProvider>
          <CMSProvider>
            {children}
          </CMSProvider>
        </LanguageProvider>
>>>>>>> Stashed changes
      </body>
    </html>
  )
}
