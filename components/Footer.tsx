'use client'

import { Mail, Phone, MapPin, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { useCMS } from '@/lib/cms'

export default function Footer() {
  const { contactInfo } = useCMS()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-[#0F172A] text-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-1">
            {contactInfo.logo ? (
              <img src={contactInfo.logo} alt={contactInfo.companyName} className="h-12 w-auto mb-4 brightness-0 invert" />
            ) : (
              <div className="text-2xl font-bold mb-4">{contactInfo.companyName}</div>
            )}
            <p className="text-white/60 text-sm mb-6">
              {contactInfo.footerDescription}
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Mail size={14} />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-[#2563EB] transition-colors">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Phone size={14} />
                <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="hover:text-[#2563EB] transition-colors">
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={14} />
                <span>{contactInfo.address}</span>
              </li>
              {contactInfo.cvr && (
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <FileText size={14} />
                  <span>CVR: {contactInfo.cvr}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {contactInfo.footerCol2Title}
            </h4>
            <ul className="space-y-3">
              {(contactInfo.footerCol2Links || []).map(link => (
                <li key={link.id}>
                  <Link href={link.href} className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {contactInfo.footerCol3Title}
            </h4>
            <ul className="space-y-3">
              {(contactInfo.footerCol3Links || []).map(link => (
                <li key={link.id}>
                  <Link href={link.href} className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {contactInfo.footerCol4Title}
            </h4>
            <ul className="space-y-3">
              {(contactInfo.footerCol4Links || []).map(link => (
                <li key={link.id}>
                  <Link href={link.href} className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} {contactInfo.companyName}. Alle rettigheder forbeholdes.
            </p>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-white/60 hover:text-[#2563EB] transition-colors text-sm"
            >
              Til toppen
              <ArrowRight size={16} className="rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
