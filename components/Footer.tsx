'use client'

import { Mail, Phone, MapPin, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/context'
import { useCMS } from '@/lib/cms'

export default function Footer() {
  const { t, lang } = useLanguage()
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
              {lang === 'da' 
                ? 'Moderne webdesign fra Danmark.' 
                : 'Modern web design from Denmark.'}
            </p>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <span className="px-2 py-0.5 bg-white/10 rounded">DK</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span className="px-2 py-0.5 bg-white/10 rounded">EN</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {lang === 'da' ? 'Navigation' : 'Navigation'}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="#services" className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                  {lang === 'da' ? 'Ydelser' : 'Services'}
                </Link>
              </li>
              <li>
                <Link href="#work" className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                  {lang === 'da' ? 'Arbejde' : 'Work'}
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                  {lang === 'da' ? 'Om os' : 'About'}
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-white/60 hover:text-[#2563EB] transition-colors text-sm">
                  {lang === 'da' ? 'Kontakt' : 'Contact'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {lang === 'da' ? 'Services' : 'Services'}
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="text-white/60 text-sm">
                  {lang === 'da' ? 'Hjemmesider' : 'Websites'}
                </span>
              </li>
              <li>
                <span className="text-white/60 text-sm">
                  {lang === 'da' ? 'Webshops' : 'Webshops'}
                </span>
              </li>
              <li>
                <span className="text-white/60 text-sm">SEO</span>
              </li>
              <li>
                <span className="text-white/60 text-sm">Meta Ads</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white/90">
              {lang === 'da' ? 'Kontakt' : 'Contact'}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Mail size={16} />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-[#2563EB] transition-colors">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Phone size={16} />
                <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="hover:text-[#2563EB] transition-colors">
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={16} />
                <span>{contactInfo.address}</span>
              </li>
              {contactInfo.cvr && (
                <li className="flex items-center gap-2 text-white/60 text-sm">
                  <FileText size={16} />
                  <span>CVR: {contactInfo.cvr}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © 2024 {contactInfo.companyName}. {lang === 'da' ? 'Alle rettigheder forbeholdes.' : 'All rights reserved.'}
            </p>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-white/60 hover:text-[#2563EB] transition-colors text-sm"
            >
              {lang === 'da' ? 'Til toppen' : 'Back to top'}
              <ArrowRight size={16} className="rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
