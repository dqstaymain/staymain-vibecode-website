'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/context'

interface HeroProps {
  customContent?: Record<string, any>
}

export default function Hero({ customContent }: HeroProps) {
  const { t } = useLanguage()
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mouseX = 0
    let mouseY = 0
    let orb1X = 0, orb1Y = 0
    let orb2X = 0, orb2Y = 0
    let orb3X = 0, orb3Y = 0
    let animationFrame: number

    function animate() {
      orb1X += (mouseX * 0.1 - orb1X) * 0.05
      orb1Y += (mouseY * 0.1 - orb1Y) * 0.05
      orb2X += (mouseX * -0.15 - orb2X) * 0.04
      orb2Y += (mouseY * -0.15 - orb2Y) * 0.04
      orb3X += (mouseX * 0.05 - orb3X) * 0.06
      orb3Y += (mouseY * 0.05 - orb3Y) * 0.06

      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${orb1X}px, ${orb1Y}px)`
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${orb2X}px, ${orb2Y}px)`
      }
      if (orb3Ref.current) {
        orb3Ref.current.style.transform = `translate(${orb3X}px, ${orb3Y}px)`
      }

      animationFrame = requestAnimationFrame(animate)
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX - window.innerWidth / 2
      mouseY = e.clientY - window.innerHeight / 2
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
  }

  const title = customContent?.title || t.hero.title
  const subtitle = customContent?.subtitle || t.hero.subtitle
  const cta1 = customContent?.cta1 || t.hero.cta1
  const cta2 = customContent?.cta2 || t.hero.cta2

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
      <div 
        ref={orb1Ref}
        className="orb orb-1 hidden sm:block" 
        style={{ top: '10%', left: '10%' }}
      />
      <div 
        ref={orb2Ref}
        className="orb orb-2 hidden sm:block" 
        style={{ top: '30%', right: '10%' }}
      />
      <div 
        ref={orb3Ref}
        className="orb orb-3 hidden sm:block" 
        style={{ bottom: '20%', left: '30%' }}
      />

      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-4 sm:mb-6">
          <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs sm:text-sm font-medium">
            Webbureau i Danmark
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white leading-[1.1] mb-6 sm:mb-8 animate-fadeInUp">
          {title}
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl sm:max-w-3xl mx-auto mb-8 sm:mb-12 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <button onClick={scrollToServices} className="btn-secondary bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50 w-full sm:w-auto text-sm sm:text-base">
            {cta1}
          </button>
          <Link href="/kontakt" className="btn-primary w-full sm:w-auto text-sm sm:text-base">
            {cta2}
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-sm sm:max-w-md lg:max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '600ms' }}>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">50+</div>
            <div className="text-white/50 text-xs sm:text-sm">Projekter</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">100%</div>
            <div className="text-white/50 text-xs sm:text-sm">Tilfredse</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">5+</div>
            <div className="text-white/50 text-xs sm:text-sm">Års erfaring</div>
          </div>
        </div>
      </div>

      <button 
        onClick={scrollToServices}
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce"
      >
        <ChevronDown size={28} />
      </button>
    </section>
  )
}
