'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import { BlockActions, BlockSection, Reveal, SectionHeader } from '@/components/blocks/primitives'
import { useCMS } from '@/lib/cms'
import type { SectionTone } from '@/lib/blocks'

/**
 * Contact details.
 *
 * This block used to have no renderer at all: adding it from the picker
 * produced a row in the outline that rendered nothing on the public page, and
 * an editor opened to an empty panel. It now renders the real details from
 * Generelle oplysninger, with `tel:` and `mailto:` links so the phone number and
 * address are actionable on a phone rather than being text to be copied by hand.
 *
 * There is no form here on purpose - see the note in lib/blocks.ts.
 */
export function ContactSection({ content }: { content?: Record<string, any> }) {
  const { contactInfo } = useCMS()
  const tone = (content?.tone as SectionTone) || 'muted'

  const details = [
    contactInfo?.phone && {
      Icon: Phone,
      label: 'Telefon',
      value: contactInfo.phone,
      href: `tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`,
    },
    contactInfo?.email && {
      Icon: Mail,
      label: 'E-mail',
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
    },
    contactInfo?.address && {
      Icon: MapPin,
      label: 'Adresse',
      value: contactInfo.address,
    },
  ].filter(Boolean) as { Icon: typeof Phone; label: string; value: string; href?: string }[]

  if (!details.length) {
    return (
      <BlockSection tone={tone} tight>
        <div className="blk-head blk-head--center">
          {content?.title && <h2 className="blk-title">{content.title}</h2>}
          <p className="blk-lede">
            Ingen kontaktoplysninger endnu. Tilføj dem under Generelle oplysninger.
          </p>
        </div>
      </BlockSection>
    )
  }

  return (
    <BlockSection tone={tone}>
      <SectionHeader
        eyebrow={content?.eyebrow}
        title={content?.title}
        description={content?.description}
        center
        className="mb-14"
      />

      <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {details.map((detail, i) => (
          <Reveal key={detail.label} delay={i * 60}>
            <div className="blk-rule pt-5">
              <detail.Icon
                size={19}
                strokeWidth={1.6}
                className="opacity-70"
                aria-hidden="true"
              />
              <p className="mt-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] opacity-60">
                {detail.label}
              </p>
              {detail.href ? (
                <a
                  href={detail.href}
                  className="mt-1.5 inline-block text-[1.0625rem] underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900 dark:decoration-white/25 dark:hover:decoration-white"
                >
                  {detail.value}
                </a>
              ) : (
                <p className="mt-1.5 text-[1.0625rem]">{detail.value}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {content?.buttonText && content?.buttonLink && (
        <BlockActions
          center
          className="mt-12"
          primary={{ text: content.buttonText, href: content.buttonLink }}
        />
      )}

      {content?.showCvr && contactInfo?.cvr && (
        <p className="mt-12 text-center text-[0.8125rem] opacity-60">CVR {contactInfo.cvr}</p>
      )}
    </BlockSection>
  )
}
