'use client'

import { Globe, ShoppingCart, Smartphone, Server, Search, Facebook, Mail, Palette, Camera } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Globe,
  ShoppingCart,
  Smartphone,
  Server,
  Search,
  Facebook,
  Mail,
  Palette,
  Camera,
}

const servicesList = [
  { key: 'Hjemmeside', desc: 'Skræddersyede hjemmesider der converterer besøgende til kunder.' },
  { key: 'Webshop', desc: 'Professionelle webshops med fokus på salg og brugeroplevelse.' },
  { key: 'Appudvikling', desc: 'Native og cross-platform apps til iOS og Android.' },
  { key: 'Support & Hosting', desc: 'Pålidelig hosting og lynhurtig support døgnet rundt.' },
  { key: 'SEO', desc: 'Optimer din synlighed og rank højere på Google.' },
  { key: 'Meta Ads', desc: 'Målrettede kampagner på Facebook og Instagram.' },
  { key: 'E-mail Marketing', desc: 'Effektive nyhedsbreve der driver engagement og salg.' },
  { key: 'Grafisk Design', desc: 'Unikt design der kommunikerer dit brands værdier.' },
  { key: 'Foto & Video', desc: 'Professionelt indhold der fortæller din virksomheds historie.' },
]

const serviceIcons = ['Globe', 'ShoppingCart', 'Smartphone', 'Server', 'Search', 'Facebook', 'Mail', 'Palette', 'Camera']

export default function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-white mb-3 sm:mb-4">
            Vores ydelser
          </h2>
          <p className="text-base text-[#64748b] dark:text-white/60 max-w-2xl mx-auto">
            Vi tilbyder alt inden for digital markedsføring og webudvikling
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {servicesList.map((service, index) => {
            const IconComponent = iconMap[serviceIcons[index]]
            return (
              <div
                key={service.key}
                className="group p-4 sm:p-5 rounded-xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 hover:border-[#2563EB] dark:hover:border-[#2563EB] transition-all duration-300 hover:shadow-lg hover:shadow-[#2563EB]/10"
              >
                <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 flex items-center justify-center mb-3 group-hover:bg-[#2563EB] transition-colors duration-300">
                  {IconComponent && (
                    <IconComponent 
                      className="w-5 h-5 text-[#2563EB] group-hover:text-white transition-colors duration-300" 
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-[#0F172A] dark:text-white mb-1">
                  {service.key}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748b] dark:text-white/60 line-clamp-2">
                  {service.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}