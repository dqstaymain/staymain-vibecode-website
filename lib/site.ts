/**
 * The site's own address, in one place.
 *
 * The sitemap, robots.txt and the admin's Google preview all have to agree on
 * this. It used to be typed into the SEO modal as a literal, so a domain change
 * would have left the sitemap pointing at the old one with nothing to catch it.
 *
 * NEXT_PUBLIC_ because the admin preview reads it in the browser; there is
 * nothing secret about a hostname. Set it in .env.local for staging or preview
 * deployments, where submitting the production domain to Search Console would be
 * wrong. Trailing slashes are stripped so a join never produces a double slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://staymain.dk'
).replace(/\/+$/, '')
