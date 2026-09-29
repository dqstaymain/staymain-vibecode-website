/**
 * The hero, as a contract shared by the public site and the admin.
 *
 * A page's hero used to be an ordinary block: you added it from the component
 * picker, it sat in the outline among the other sections, and it could be
 * reordered or deleted. That made it optional in practice, and a page with no
 * hero opened on whatever section happened to be first - which is how a page
 * ends up with no H1 at all.
 *
 * The hero is now a fixed part of every page. It lives at the top of the block
 * list because that is where it already renders and where it is stored, but the
 * admin treats it as a panel of its own rather than a row in the outline, so
 * there is nothing to add, remove or drag. `normalisePageHero` is what makes
 * that true for pages that already exist.
 *
 * Kept free of `'use client'` and of any import from `lib/cms`, so the server
 * and both halves of the admin can read it. The page shape it needs is declared
 * structurally rather than imported, which keeps the module free of a cycle.
 */

/** How loudly a page announces itself. */
export type HeroImpact = 'high' | 'medium' | 'low'

interface HeroImpactSpec {
  /** Danish, as the rest of the admin is. */
  label: string
  description: string
  /** Section height. The gradient and orbs only read at full height. */
  minHeight: string
  /** Title size. */
  titleClass: string
  /** The bounce-to-content chevron. Only earns its place on a full-height hero. */
  showChevron: boolean
  /** Mouse-tracking orbs, gradient background only. */
  showOrbs: boolean
  /**
   * What picking this level sets the editable fields to.
   *
   * Switching level writes these, so the switch produces one coherent result
   * instead of a shorter hero that still claims to be centred with a stats row.
   */
  editorDefaults: {
    alignment: 'center' | 'left'
    showStats: boolean
    backgroundType: 'gradient' | 'image' | 'video'
  }
}

/**
 * The three levels.
 *
 * Ordered from loudest to quietest, and deliberately not a slider: these are
 * three distinct designs, and picking between them by feel is the point. The
 * sizes are the existing hero's own scale, stepped down, so switching a page
 * from high to low does not rescale type the editor had already tuned by eye.
 */
export const HERO_IMPACTS: Record<HeroImpact, HeroImpactSpec> = {
  high: {
    label: 'Høj effekt',
    description: 'Fuld skærmhøjde, centreret, med gradient og statistik. Til forsiden.',
    minHeight: 'min-h-screen',
    titleClass: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    showChevron: true,
    showOrbs: true,
    editorDefaults: { alignment: 'center', showStats: true, backgroundType: 'gradient' },
  },
  medium: {
    label: 'Mellem effekt',
    description: 'Omkring to tredjedele af skærmen, venstrestillet og uden statistik.',
    minHeight: 'min-h-[68vh] lg:min-h-[72vh]',
    titleClass: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    showChevron: false,
    showOrbs: false,
    editorDefaults: { alignment: 'left', showStats: false, backgroundType: 'gradient' },
  },
  low: {
    label: 'Lav effekt',
    description: 'Kompakt banner. Til indholdssider, hvor overskriften ikke skal være hovedbudskabet.',
    minHeight: 'min-h-[42vh] lg:min-h-[46vh]',
    titleClass: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    showChevron: false,
    showOrbs: false,
    editorDefaults: { alignment: 'left', showStats: false, backgroundType: 'gradient' },
  },
}

export const HERO_IMPACT_ORDER: HeroImpact[] = ['high', 'medium', 'low']

/** Falls back to `high`, which is what every hero looked like before this. */
export function heroImpact(content?: Record<string, any>): HeroImpact {
  const claimed = content?.impact
  return claimed === 'medium' || claimed === 'low' ? claimed : 'high'
}

/** A hero with nothing filled in, sized for a page that has never had one. */
export function defaultHeroContent(title?: string): Record<string, any> {
  return {
    impact: 'high',
    title: title || '',
    description: '',
    badge: '',
    alignment: 'center',
    backgroundType: 'gradient',
    backgroundImage: null,
    backgroundVideo: null,
    backgroundOverlay: 0.5,
    showStats: true,
  }
}

/**
 * Applies an impact level to a hero's editable fields.
 *
 * Only the fields the level owns are touched. Copy, buttons, badge and any
 * background media already chosen are left alone, so downgrading a page's hero
 * does not throw away the writing somebody did to it.
 */
export function applyHeroImpact(
  content: Record<string, any> | undefined,
  impact: HeroImpact
): Record<string, any> {
  const spec = HERO_IMPACTS[impact]
  return {
    ...defaultHeroContent(),
    ...(content ?? {}),
    impact,
    alignment: spec.editorDefaults.alignment,
    showStats: spec.editorDefaults.showStats,
    backgroundType:
      // A chosen image or video wins over the level's preferred background:
      // overriding it would silently throw the media away.
      content?.backgroundImage || content?.backgroundVideo
        ? (content.backgroundType ?? spec.editorDefaults.backgroundType)
        : spec.editorDefaults.backgroundType,
  }
}

/** Structural view of a block, so this module needs nothing from lib/cms. */
interface BlockLike {
  id: string
  type: string
  content?: Record<string, any>
}

interface PageLike {
  title?: string
  blocks: BlockLike[]
}

function heroId(): string {
  return `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Guarantees the invariant: exactly one hero, and it is the first block.
 *
 * Run on every load rather than as a database migration, because the pages that
 * need it are already stored - a migration would have to rewrite rows, and the
 * next save writes the whole array back anyway, so the load-time pass is where
 * the shape gets fixed for free.
 *
 * Three cases, all of which occur in real data:
 *  - a page whose hero sits further down the list, because it was added second
 *    or dragged there before this existed;
 *  - a page with no hero at all, which is every page created since the picker
 *    stopped being the only way in;
 *  - a page with more than one hero, which the old picker allowed.
 *
 * For the last case the first hero wins and the rest are dropped. Two heroes on
 * one page is not a state this UI can produce any more, and keeping the second
 * would keep rendering a duplicate full-height section.
 */
export function normalisePageHero<T extends PageLike>(page: T): T {
  const blocks = Array.isArray(page.blocks) ? page.blocks : []
  const heroes = blocks.filter(b => b.type === 'hero')
  const rest = blocks.filter(b => b.type !== 'hero')
  const hero: BlockLike =
    heroes[0] ?? { id: heroId(), type: 'hero', content: defaultHeroContent(page.title) }

  return { ...page, blocks: [hero, ...rest] }
}

/** The blocks an editor can add to, move or delete. The hero is not one. */
export function contentBlocks<T extends BlockLike>(blocks: T[]): T[] {
  return blocks.filter(b => b.type !== 'hero')
}
