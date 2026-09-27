import type { Metadata } from 'next'
import './globals.css'
import { CMSProvider } from '@/lib/cms'
import { LanguageProvider } from '@/lib/context'

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
    // globals.css sets `scroll-behavior: smooth` on <html> for the anchor
    // links. Next.js 16 no longer overrides that during route transitions, so
    // without this attribute every client-side navigation would animate a long
    // smooth scroll to the top. This restores the previous behaviour.
    <html lang="da" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <CMSProvider>
            {children}
          </CMSProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
