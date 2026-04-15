'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { useLanguage } from '@/lib/context'

export default function Testimonials() {
  const { t, lang } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const testimonials = t.testimonials.items

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  return (
    <section className="py-20 sm:py-28 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] dark:text-white mb-4">
            {t.testimonials.title}
          </h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((item, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-8 sm:p-12 shadow-lg border border-[#E2E8F0] dark:border-white/10">
                    <Quote className="w-10 h-10 text-[#2563EB] mb-6" />
                    <p className="text-lg sm:text-xl lg:text-2xl text-[#334155] dark:text-white/90 mb-8 leading-relaxed">
                      "{item.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-[#2563EB]">
                          {item.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#0F172A] dark:text-white">
                          {item.author}
                        </div>
                        <div className="text-sm text-[#64748b] dark:text-white/60">
                          {lang === 'da' ? item.role : item.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goToPrev}
              className="p-2 rounded-full bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-[#64748b] dark:text-white/60 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all duration-200"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-[#2563EB] w-6' 
                      : 'bg-[#CBD5E1] dark:bg-white/30 hover:bg-[#2563EB]/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-2 rounded-full bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-[#64748b] dark:text-white/60 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all duration-200"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
