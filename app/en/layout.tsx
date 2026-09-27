import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Favicon from '@/components/Favicon'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Favicon />
      <Navigation />
      {children}
      <Footer />
    </>
  )
}
