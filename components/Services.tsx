'use client'

import { Globe, ShoppingCart, Smartphone, Server, Search, Facebook, Mail, Palette, Camera } from 'lucide-react'
import { useLanguage } from '@/lib/context'
import { servicesList } from '@/lib/translations'

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

const serviceIcons = ['Globe', 'ShoppingCart', 'Smartphone', 'Server', 'Search', 'Facebook', 'Mail', 'Palette', 'Camera']

export default function Services() {
  const { lang } = useLanguage()

  return (
    <section id="services" className="py-20 sm:py-28 lg:py-32 bg-white dark:bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] dark:text-white mb-4 sm:mb-6">
            {lang === 'da' ? 'Vores ydelser' : 'Our Services'}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#64748b] dark:text-white/60 max-w-2xl mx-auto">
            {lang === 'da' 
              ? 'Vi tilbyder alt inden for digital markedsføring og webudvikling' 
              : 'Full-service digital marketing and web development'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {servicesList.map((service, index) => {
            const IconComponent = iconMap[serviceIcons[index]]
            return (
              <div
                key={service.key}
                className="group p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10 hover:border-[#2563EB] dark:hover:border-[#2563EB] transition-all duration-300 hover:shadow-xl hover:shadow-[#2563EB]/10"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-4 group-hover:bg-[#2563EB] transition-colors duration-300">
                  {IconComponent && (
                    <IconComponent 
                      className="w-6 h-6 text-[#2563EB] group-hover:text-white transition-colors duration-300" 
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] dark:text-white mb-2">
                  {lang === 'da' ? service.key : service.keyEn}
                </h3>
                <p className="text-sm text-[#64748b] dark:text-white/60">
                  {lang === 'da' ? service.desc : service.descEn}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
