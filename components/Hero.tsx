'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { ArrowRight, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface HeroProps {
  customContent?: Record<string, any>
  title?: string
  description?: ReactNode
  buttons?: Array<{
    label: string
    href?: string
    onClick?: () => void
    variant?: 'primary' | 'secondary'
    icon?: 'arrow' | 'external'
  }>
  backgroundType?: 'gradient' | 'image' | 'video'
  backgroundImage?: string
  backgroundVideo?: string
  backgroundOverlay?: number
  showOrbs?: boolean
  showStats?: boolean
  badge?: string
  alignment?: 'left' | 'center'
}

function RichText({ content, alignment = 'center' }: { content: ReactNode; alignment?: 'left' | 'center' }) {
  if (typeof content === 'string') {
    return (
      <p className={`text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl sm:max-w-3xl mb-8 sm:mb-12 animate-fadeInUp ${alignment === 'left' ? '' : 'mx-auto'}`}>
        {content}
      </p>
    )
  }
  return <>{content}</>
}

export default function Hero({
  customContent,
  title,
  description,
  buttons,
  backgroundType = 'gradient',
  backgroundImage,
  backgroundVideo,
  backgroundOverlay = 0.5,
  showOrbs = true,
  showStats = true,
  badge,
  alignment
}: HeroProps) {
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showOrbs) return
    
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
  }, [showOrbs])

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
  }

  const heroTitle = title || customContent?.title || 'Vi skaber digitale oplevelser, der tæller.'
  const heroDescription = description || customContent?.description || customContent?.subtitle || 'StayMain er et kreativt webbureau i Danmark. Vi kombinerer moderne design med teknisk ekspertise for at bygge websites, der leverer resultater.'
  const heroBadge = badge || customContent?.badge || 'Webbureau i Danmark'
  const heroShowStats = customContent?.showStats !== undefined ? customContent.showStats : showStats
  
  const heroBgImage = customContent?.backgroundImage || backgroundImage
  const heroBgVideo = customContent?.backgroundVideo || backgroundVideo
  
  const heroBackgroundType = heroBgVideo 
    ? 'video' 
    : heroBgImage 
      ? 'image' 
      : (customContent?.backgroundType || backgroundType)
  
  const heroBackgroundImage = heroBgImage
  const heroBackgroundVideo = heroBgVideo?.trim() || ''
  const heroBackgroundOverlay = customContent?.backgroundOverlay ?? backgroundOverlay
  const heroAlignment = customContent?.alignment || alignment || 'center'

  const defaultButtons: Array<{
    label: string
    href?: string
    onClick?: () => void
    variant: 'primary' | 'secondary'
    icon: 'arrow' | 'external'
  }> = []

  if (customContent?.button1Label) {
    defaultButtons.push({
      label: customContent.button1Label,
      href: customContent.button1Href || '#services',
      onClick: customContent.button1Href ? undefined : scrollToServices,
      variant: 'secondary',
      icon: 'arrow'
    })
  }
  if (customContent?.button2Label) {
    defaultButtons.push({
      label: customContent.button2Label,
      href: customContent.button2Href || '/kontakt',
      variant: 'primary',
      icon: 'arrow'
    })
  }
  if (defaultButtons.length === 0) {
    defaultButtons.push(
      {
        label: 'Se vores ydelser',
        href: '#services',
        onClick: scrollToServices,
        variant: 'secondary',
        icon: 'arrow'
      },
      {
        label: 'Lad os tale sammen',
        href: '/kontakt',
        variant: 'primary',
        icon: 'arrow'
      }
    )
  }

  const heroButtons = buttons || defaultButtons

  const renderButton = (button: typeof heroButtons[0], index: number) => {
    const baseClass = button.variant === 'primary' 
      ? 'btn-primary w-full sm:w-auto text-sm sm:text-base' 
      : 'btn-secondary bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50 w-full sm:w-auto text-sm sm:text-base'

    if (button.onClick) {
      return (
        <button 
          key={index} 
          onClick={button.onClick} 
          className={`${baseClass} animate-fadeInUp`}
          style={{ animationDelay: `${400 + index * 100}ms` }}
        >
          {button.label}
          {button.icon === 'arrow' && <ArrowRight size={18} />}
          {button.icon === 'external' && <ExternalLink size={18} />}
        </button>
      )
    }

    return (
      <Link 
        key={index}
        href={button.href || '/'}
        className={`${baseClass} animate-fadeInUp flex items-center justify-center gap-2`}
        style={{ animationDelay: `${400 + index * 100}ms` }}
      >
        {button.label}
        {button.icon === 'arrow' && <ArrowRight size={18} />}
        {button.icon === 'external' && <ExternalLink size={18} />}
      </Link>
    )
  }

  const getBackgroundClass = () => {
    switch (heroBackgroundType) {
      case 'image':
        return ''
      case 'video':
        return ''
      default:
        return 'hero-gradient'
    }
  }

  return (
    <section className={`relative min-h-screen flex items-center justify-center ${getBackgroundClass()} overflow-hidden`}>
      {heroBackgroundType === 'image' && heroBackgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackgroundImage})` }}
        />
      )}
      
      {heroBackgroundType === 'video' && heroBackgroundVideo && (
        <video
          key={heroBackgroundVideo}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={heroBackgroundVideo} type="video/mp4" />
        </video>
      )}

      {(heroBackgroundType === 'image' || heroBackgroundType === 'video') && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: heroBackgroundOverlay }}
        />
      )}

      {showOrbs && heroBackgroundType === 'gradient' && (
        <>
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
        </>
      )}

      <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${heroAlignment === 'left' ? 'text-left' : 'text-center'}`}>
        {heroBadge && (
          <div className="mb-4 sm:mb-6 animate-fadeInUp">
            <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs sm:text-sm font-medium">
              {heroBadge}
            </span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-[1.1] mb-6 sm:mb-8 animate-fadeInUp">
          {heroTitle}
        </h1>

        <RichText content={heroDescription} alignment={heroAlignment} />

        <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${heroAlignment === 'left' ? '' : 'items-center justify-center'}`}>
          {heroButtons.map((button, index) => renderButton(button, index))}
        </div>

        {heroShowStats && (
          <div className={`mt-12 sm:mt-16 lg:mt-20 flex flex-wrap gap-4 sm:gap-8 lg:gap-12 animate-fadeInUp ${heroAlignment === 'left' ? '' : 'justify-center'}`} style={{ animationDelay: '600ms' }}>
            <div className={heroAlignment === 'left' ? 'text-left' : 'text-center'}>
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">{customContent?.stat1Number || '50+'}</div>
              <div className="text-white/50 text-xs sm:text-sm">{customContent?.stat1Label || 'Projekter'}</div>
            </div>
            <div className={heroAlignment === 'left' ? 'text-left' : 'text-center'}>
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">{customContent?.stat2Number || '100%'}</div>
              <div className="text-white/50 text-xs sm:text-sm">{customContent?.stat2Label || 'Tilfredse'}</div>
            </div>
            <div className={heroAlignment === 'left' ? 'text-left' : 'text-center'}>
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1">{customContent?.stat3Number || '5+'}</div>
              <div className="text-white/50 text-xs sm:text-sm">{customContent?.stat3Label || 'Års erfaring'}</div>
            </div>
          </div>
        )}
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
