'use client'

import Image from 'next/image'
import Link from 'next/link'

interface ContentImageBlockProps {
  content?: {
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    button2Text?: string
    button2Link?: string
    image?: string
    imageAlt?: string
    layout?: 'image-left' | 'image-right'
  }
}

export default function ContentImageBlock({ content }: ContentImageBlockProps) {
  const layout = content?.layout || 'image-left'
  const isImageLeft = layout === 'image-left'

  const title = content?.title || 'Overskrift her'
  const description = content?.description || 'Beskrivelse her...'
  const buttonText = content?.buttonText
  const buttonLink = content?.buttonLink
  const button2Text = content?.button2Text
  const button2Link = content?.button2Link
  const imageSrc = content?.image || ''
  const imageAlt = content?.imageAlt || title

  return (
    <section className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center`}>
          <div className={`order-1 ${isImageLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              {imageSrc ? (
                <Image
                  key={imageSrc}
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className={`order-2 ${isImageLeft ? 'lg:order-2' : 'lg:order-1'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-white mb-4 sm:mb-6">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-[#64748b] dark:text-white/60 mb-6 sm:mb-8 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap gap-3">
              {buttonText && buttonLink && (
                <Link
                  href={buttonLink}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg transition-colors duration-300 text-sm sm:text-base"
                >
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              {button2Text && button2Link && (
                <Link
                  href={button2Link}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#0F172A] dark:bg-white hover:bg-[#1E293B] dark:hover:bg-slate-100 text-white dark:text-[#0F172A] font-medium rounded-lg transition-colors duration-300 text-sm sm:text-base"
                >
                  {button2Text}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}