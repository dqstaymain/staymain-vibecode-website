'use client'

import {
  BarChart3,
  Camera,
  Code,
  Globe,
  Mail,
  Megaphone,
  Palette,
  Search,
  Server,
  ShoppingCart,
  Smartphone,
  Target,
} from 'lucide-react'
import { BlockSection, Reveal, SectionHeader } from '@/components/blocks/primitives'
import { SERVICE_ICONS, type SectionTone } from '@/lib/blocks'

const ICONS: Record<string, React.ElementType> = {
  globe: Globe,
  shopping: ShoppingCart,
  mobile: Smartphone,
  server: Server,
  search: Search,
  megaphone: Megaphone,
  mail: Mail,
  palette: Palette,
  camera: Camera,
  chart: BarChart3,
  code: Code,
  target: Target,
}

/**
 * Capabilities as quiet cards.
 *
 * One tint, one hairline, one small radius — the grid carries the section, not
 * the tiles. Icons sit in a neutral tile rather than a brand wash so a dozen
 * services read as one practice, and nothing lifts or glows on hover.
 */
export function ServicesSection({ content }: { content?: Record<string, any> }) {
  const tone = (content?.tone as SectionTone) || 'light'
  const items: any[] = Array.isArray(content?.items) ? content.items : []

  const columns =
    items.length <= 2
      ? 'sm:grid-cols-2'
      : items.length === 3
        ? 'sm:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <BlockSection tone={tone}>
      <SectionHeader
        eyebrow={content?.eyebrow}
        title={content?.title}
        description={content?.description}
        center
        className="mb-12"
      />

      {items.length > 0 && (
        <div className={`grid gap-4 sm:gap-5 ${columns}`}>
          {items.map((item, index) => {
            const Icon = ICONS[item?.icon] ?? Globe
            return (
              <Reveal key={item.id || `svc-${index}`} delay={Math.min(index, 5) * 60}>
                <div className="blk-card h-full p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[0.05] text-slate-900 dark:bg-white/10 dark:text-white">
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[0.9375rem] font-semibold leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed opacity-70">{item.description}</p>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      )}
    </BlockSection>
  )
}

export { SERVICE_ICONS }
