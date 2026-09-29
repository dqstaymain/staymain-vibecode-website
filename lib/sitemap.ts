import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'

/**
 * The URL list behind /sitemap.xml.
 *
 * Kept out of the route file so the URL rules - which slug serves which path, and
 * which of those collide - are one testable thing rather than something buried in
 * a default export.
 *
 * Read server-side from Supabase rather than from the CMS context: the pages live
 * in the database, and a sitemap has to exist before anybody has loaded the site.
 */

/**
 * Public routes that exist as files in app/, independently of the CMS.
 *
 * Written decoded. They go through the same `slugToPath` a CMS slug does, which
 * is the point: comparing an encoded CMS path against a hand-written raw one
 * looks like it de-duplicates and does not, which is how the FAQ ended up in the
 * file twice - once percent-encoded, once not.
 */
export const STATIC_PUBLIC_ROUTES = [
  '/',
  '/cases',
  '/om-os',
  '/ydelser',
  '/ofte-stillede-spørgsmål',
]

/**
 * The path that serves a CMS slug.
 *
 * Two things the raw slug cannot be used for. The front page is a CMS page whose
 * slug is "home" but whose address is "/". And a slug can carry non-ASCII
 * characters - "ofte-stillede-spørgsmål" is a real one here - which have to be
 * percent-encoded in a <loc>, segment by segment so the path separators survive.
 */
export function slugToPath(slug: string): string {
  const trimmed = (slug ?? '').replace(/^\/+|\/+$/g, '')
  if (trimmed === '' || trimmed === 'home') return '/'
  return '/' + trimmed.split('/').map(encodeURIComponent).join('/')
}

interface SitemapPage {
  slug: string
  updatedAt?: string
}

export type { SitemapPage }

/**
 * Whether `cms_pages` carries the `updated_at` column.
 *
 * The column arrives with supabase/migrations/002_add_updated_at.sql, so until
 * that has been run in Supabase it does not exist. Asking for it unconditionally
 * makes PostgREST reject the whole query with "column cms_pages.updated_at does
 * not exist" - which would empty the sitemap entirely rather than cost it the
 * dates, so the two are requested separately.
 *
 * Cached for the life of the process. The column cannot appear without a
 * migration, and the conclusion is only recorded once the plain query has proved
 * the database is otherwise reachable.
 */
let hasUpdatedAt: boolean | undefined

async function loadPages(): Promise<SitemapPage[] | null> {
  const { data, error } = await supabase.from('cms_pages').select('slug, updated_at')

  if (!error && data) {
    hasUpdatedAt = true
    return data.map(row => ({
      slug: row.slug,
      updatedAt: row.updated_at || undefined,
    }))
  }

  // Already known to be unavailable, so this was a real failure. Returning null
  // leaves the caller with the routes it can still list.
  if (hasUpdatedAt === false) return null

  const retry = await supabase.from('cms_pages').select('slug')
  if (retry.error || !retry.data) return null

  hasUpdatedAt = false
  return retry.data.map(row => ({ slug: row.slug }))
}

export interface SitemapEntry {
  url: string
  /** Omitted rather than guessed when the database has no date for the row. */
  lastModified?: string
}

/**
 * Every public path, de-duplicated, mapped to the date it was last edited.
 *
 * Split out from buildSitemap and free of any I/O because the URL rules are the
 * part that breaks quietly: a path that gets listed twice is reported by Search
 * Console as an error rather than ignored, and a non-ASCII path that skips
 * encoding produces a second URL for a page that already has one. Neither is
 * visible from reading buildSitemap, so scripts/test-sitemap.ts asserts them.
 *
 * Pages go in first so a path that also has a route file still carries its
 * `lastModified`; the route files then fill in only what no page claimed.
 *
 * Deliberately absent: the /en tree. Those routes render the same CMS page as
 * their Danish counterparts - `app/en/page.tsx` asks for slug "home" and
 * `app/en/layout.tsx` is byte-identical to `app/(public)/layout.tsx` - so every
 * one of them is a second address for content that already has one. Listing them
 * would hand Google a duplicate of every page and leave it to guess which to
 * index. Fixing that duplication is separate work; the sitemap just declines to
 * make it worse.
 */
export function collectSitemapPaths(pages: SitemapPage[]): Map<string, string | undefined> {
  const paths = new Map<string, string | undefined>()

  for (const page of pages) {
    const path = slugToPath(page.slug)
    if (paths.has(path)) continue
    paths.set(path, page.updatedAt)
  }

  for (const route of STATIC_PUBLIC_ROUTES) {
    const path = slugToPath(route)
    if (paths.has(path)) continue
    paths.set(path, undefined)
  }

  return paths
}

export async function buildSitemap(): Promise<SitemapEntry[]> {
  const paths = collectSitemapPaths((await loadPages()) ?? [])

  return Array.from(paths, ([path, lastModified]) => ({
    url: SITE_URL + path,
    lastModified,
  }))
}
