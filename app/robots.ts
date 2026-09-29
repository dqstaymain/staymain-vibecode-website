import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt.
 *
 * Two jobs here. It points crawlers at the sitemap, which is how Search Console
 * finds it without being told by hand. And it keeps them out of /admin, which is
 * a login-gated CMS whose URLs have no business in an index - the login page in
 * particular is a page that exists only for people who are already here.
 *
 * /api is disallowed for the same reason: those routes return JSON, and there is
 * nothing in them to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
