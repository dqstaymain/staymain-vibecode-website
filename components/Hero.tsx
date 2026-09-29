'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { ArrowRight, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { HERO_IMPACTS, heroImpact } from '@/lib/hero'
import { cx } from '@/lib/cx'

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
  /**
   * What the agency does, as a list. An agency hero that only says it is an
   * agency is an assertion; this is the evidence, and it is the one line that
   * makes the hero read as a web bureau rather than as a template.
   */
  capabilities?: string[]
  backgroundType?: 'gradient' | 'image' | 'video'
  backgroundImage?: string
  backgroundVideo?: string
  backgroundOverlay?: number
  showOrbs?: boolean
  showStats?: boolean
  badge?: string
  alignment?: 'left' | 'center'
}

/** What the bureau does, stated in the order the nav lists it. */
const DEFAULT_CAPABILITIES = ['Webdesign', 'Webshop', 'SEO', 'Meta Ads']

function videoMimeType(src: string): string {
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase() || ''
  if (ext === 'webm') return 'video/webm'
  if (ext === 'ogv' || ext === 'ogg') return 'video/ogg'
  if (ext === 'mov') return 'video/quicktime'
  return 'video/mp4'
}

/** Accepts an array or the comma/newline separated string the editor stores. */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  return value
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function RichText({ content, alignment = 'center' }: { content: ReactNode; alignment?: 'left' | 'center' }) {
  // `mx-auto` only when centred. It used to be unconditional, which left the
  // sub-paragraph floating in the middle of a left-aligned hero.
  const centring = alignment === 'center' ? 'mx-auto' : ''
  if (typeof content === 'string') {
    return (
      <p className={cx('hero-sub mb-9 max-w-xl text-base sm:text-lg', centring)}>
        {content}
      </p>
    )
  }
  // Custom markup from the editor. The colour is set on the wrapper so plain
  // paragraphs inside it inherit the muted tone instead of shouting in white.
  return (
    <div
      className={cx(
        'mb-9 max-w-xl text-base sm:text-lg text-[rgba(226,232,255,0.74)]',
        centring
      )}
    >
      {content}
    </div>
  )
}

export default function Hero({
  customContent,
  title,
  description,
  buttons,
  capabilities,
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

  // How loudly the page opens. The level owns the things that make a hero feel
  // big or small - how tall it is, how large the title, whether the chevron and
  // the drifting orbs are there at all - so it is read from one place rather
  // than inferred from whichever combination of fields happens to be set.
  //
  // Resolved before the orb effect, which has to know whether to attach a
  // mousemove listener at all rather than attaching one and drawing nothing.
  const impact = heroImpact(customContent)
  const spec = HERO_IMPACTS[impact]
  const heroMinHeight = spec.minHeight
  const heroTitleClass = spec.titleClass
  const heroShowChevron = spec.showChevron
  // The level cannot switch orbs on; the prop can still switch them off.
  const heroShowOrbs = spec.showOrbs && showOrbs

  useEffect(() => {
    if (!heroShowOrbs) return
    
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
  }, [heroShowOrbs])

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

  /**
   * The service list. Falls back to the agency's own on a high-impact hero,
   * because the homepage hero is the one that has to say what the bureau does
   * and the stored field is empty on pages that predate it. A quiet hero has no
   * room for it, so `low` never gets a list at all.
   *
   * Clearing the field therefore restores the default rather than emptying the
   * row; that is the same bargain the title and buttons already make.
   */
  const configuredCapabilities = toList(customContent?.capabilities)
  const heroCapabilities =
    configuredCapabilities.length > 0
      ? configuredCapabilities
      : impact === 'low'
        ? []
        : DEFAULT_CAPABILITIES

  const renderButton = (button: typeof heroButtons[0], index: number) => {
    const baseClass = button.variant === 'primary'
      ? 'btn-primary text-sm sm:text-base'
      : 'btn-secondary bg-transparent text-white border-white/25 hover:bg-white/10 hover:border-white/50 text-sm sm:text-base'

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

  const isGradient = heroBackgroundType === 'gradient'
  const hasMedia = heroBackgroundType === 'image' || heroBackgroundType === 'video'

  return (
    <section
      className={cx(
        'relative isolate flex items-center overflow-hidden',
        heroMinHeight,
        isGradient ? 'hero-gradient' : 'bg-[var(--night)]'
      )}
    >
      {/* The brand backdrop is behind every background type, not just the
          gradient. A video or image that fails to load - no H.264 decoder,
          autoplay blocked, a dead URL - used to leave the hero a black
          rectangle; now it falls back to the same royal aurora the gradient
          uses, so a failure still looks designed. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="hero-aurora" />
        {heroShowOrbs && (
          <>
            <div ref={orb1Ref} className="orb orb-1 hidden opacity-70 sm:block" style={{ top: '4%', left: '6%' }} />
            <div ref={orb2Ref} className="orb orb-2 hidden opacity-60 sm:block" style={{ top: '26%', right: '6%' }} />
            <div ref={orb3Ref} className="orb orb-3 hidden opacity-50 sm:block" style={{ bottom: '12%', left: '26%' }} />
          </>
        )}
        <div className="hero-grid" />
        <div className="hero-grain" />
      </div>

      {heroBackgroundType === 'image' && heroBackgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${heroBackgroundImage.replace(/"/g, '\\"')}")` }}
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
          {/* The media library also accepts webm/ogv; hardcoding mp4 made the
              browser refuse to play those files. */}
          <source src={heroBackgroundVideo} type={videoMimeType(heroBackgroundVideo)} />
        </video>
      )}

      {hasMedia && (
        <>
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: heroBackgroundOverlay }}
          />
          {/* Sits on top of the flat overlay, shaped to the alignment, so the
              copy is readable without flattening the whole video. */}
          <div
            aria-hidden
            className={cx(
              'absolute inset-0',
              heroAlignment === 'left' ? 'hero-scrim-left' : 'hero-scrim-center'
            )}
          />
        </>
      )}

      {/* max-w-7xl and the same padding as the nav, the services and the
          footer, so the headline's left edge is a straight line down the page.
          Centring the block inside a narrower container left 400px of dead
          space to its right. */}
      <div
        className={cx(
          'relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
          heroAlignment === 'left' ? 'text-left' : 'text-center',
          // text-shadow inherits, so this covers the headline, the sub, the
          // capability row and the stats in one go.
          hasMedia && 'hero-on-media'
        )}
      >
        {heroBadge && (
          /* justify is explicit because this is a flex row for the leading
             rule; without it the label stayed hard left on a centred hero. */
          <p
            className={cx(
              'hero-eyebrow mb-7 flex items-center gap-3 animate-fadeInUp sm:mb-8',
              heroAlignment === 'left' ? '' : 'justify-center'
            )}
          >
            {/* The rule is what stops the label reading as a stray label. */}
            <span aria-hidden className="h-px w-8 bg-[var(--brand-400)]" />
            {heroBadge}
          </p>
        )}

        <h1
          className={cx(
            'mb-6 text-white [text-wrap:balance] sm:mb-7 animate-fadeInUp',
            heroTitleClass
          )}
        >
          {heroTitle}
        </h1>

        <RichText content={heroDescription} alignment={heroAlignment} />

        <div
          className={cx(
            'flex flex-col gap-3 sm:flex-row sm:gap-4',
            heroAlignment === 'left' ? '' : 'items-center justify-center'
          )}
        >
          {heroButtons.map((button, index) => renderButton(button, index))}
        </div>

        {heroCapabilities.length > 0 && (
          <ul
            className={cx(
              'hero-capabilities mt-12 flex flex-wrap gap-y-3 sm:mt-14 animate-fadeInUp',
              heroAlignment === 'left' ? '' : 'justify-center'
            )}
            style={{ animationDelay: '500ms' }}
          >
            {heroCapabilities.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {heroShowStats && (
          <dl
            className={cx(
              'mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8 animate-fadeInUp sm:mt-16 sm:gap-10',
              heroAlignment === 'left' ? '' : 'mx-auto'
            )}
            style={{ animationDelay: '600ms' }}
          >
            {[
              { value: customContent?.stat1Number || '50+', label: customContent?.stat1Label || 'Projekter' },
              { value: customContent?.stat2Number || '100%', label: customContent?.stat2Label || 'Tilfredse' },
              { value: customContent?.stat3Number || '5+', label: customContent?.stat3Label || 'Års erfaring' },
            ].map(stat => (
              <div key={stat.label}>
                <dd className="hero-stat-value text-2xl sm:text-3xl lg:text-4xl">{stat.value}</dd>
                <dt className="hero-stat-label mt-2.5">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {heroShowChevron && (
        <button
          onClick={scrollToServices}
          aria-label="Rul ned til indhold"
          className="hero-scroll-cue absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8"
        >
          <ChevronDown size={24} className="animate-bounce" />
        </button>
      )}
    </section>
  )
}
