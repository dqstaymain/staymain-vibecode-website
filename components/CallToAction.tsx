'use client'

import { ReactNode, useEffect, useRef } from 'react'

export default function CallToAction({ title, description }: { title: string; description?: ReactNode }) {
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mouseX = 0
    let mouseY = 0
    let orb1X = 0, orb1Y = 0
    let orb2X = 0, orb2Y = 0
    let animationFrame: number

    function animate() {
      orb1X += (mouseX * 0.15 - orb1X) * 0.06
      orb1Y += (mouseY * 0.15 - orb1Y) * 0.06
      orb2X += (mouseX * -0.2 - orb2X) * 0.05
      orb2Y += (mouseY * -0.2 - orb2Y) * 0.05

      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${orb1X}px, ${orb1Y}px)`
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${orb2X}px, ${orb2Y}px)`
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

  return (
    <section className="relative">
      <div ref={orb1Ref} className="absolute -top-20 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-50 pointer-events-none" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }} />
      <div ref={orb2Ref} className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[180px] opacity-40 pointer-events-none" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)' }} />

      <div className="py-20 sm:py-32 relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] mb-4 sm:mb-6">
          {title}
        </h2>
        {description && (
          <div className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            {description}
          </div>
        )}
      </div>
    </section>
  )
}