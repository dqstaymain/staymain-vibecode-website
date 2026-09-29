import type { MetadataRoute } from 'next'
import { buildSitemap } from '@/lib/sitemap'

/**
 * The sitemap at /sitemap.xml, which is what Google Search Console reads.
 *
 * Rebuilt hourly rather than frozen at build time. Pages come from the CMS, so a
 * build-time snapshot would go on submitting URLs for pages that had been
 * deleted and would never submit a page that had been added - a sitemap that
 * quietly disagrees with the site is worse than no sitemap. An hour is far
 * shorter than the interval Google actually fetches it at.
 *
 * No `changefreq` and no `priority`. Google documents both as ignored, so
 * emitting them would look like tuning while changing nothing.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}
