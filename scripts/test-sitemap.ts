/**
 * Checks the sitemap's URL rules.
 *
 * These are the failures that are invisible from reading the code and only show
 * up as an error in Search Console: a path listed twice, or a non-ASCII path
 * that skipped percent-encoding and became a second URL for a page that already
 * had one. Both were real - the FAQ appeared twice, encoded and not - and neither
 * is something tsc, the build or a route sweep would catch.
 *
 * The pure part of the sitemap is separated from the Supabase read precisely so
 * this can run with no network and no database.
 */
import { collectSitemapPaths, slugToPath, STATIC_PUBLIC_ROUTES } from '../lib/sitemap'

let failures = 0
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    failures++
    console.log(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`)
  } else {
    console.log(`ok   ${name}`)
  }
}
function invariant(name: string, cond: boolean) {
  if (cond) console.log(`ok   ${name}`)
  else {
    failures++
    console.log(`FAIL ${name}`)
  }
}

/* ------------------------------------------------------------ slugToPath -- */

check('home is served at the root', slugToPath('home'), '/')
check('an empty slug is the root', slugToPath(''), '/')
check('a top-level slug', slugToPath('cases'), '/cases')
check(
  'a nested slug keeps its separators',
  slugToPath('ydelser/webshop'),
  '/ydelser/webshop'
)
check(
  'a non-ASCII slug is percent-encoded per segment',
  slugToPath('ofte-stillede-spørgsmål'),
  '/ofte-stillede-sp%C3%B8rgsm%C3%A5l'
)
check(
  'a non-ASCII segment inside a nested slug',
  slugToPath('ydelser/æøå'),
  '/ydelser/%C3%A6%C3%B8%C3%A5'
)
check('surrounding slashes are ignored', slugToPath('/cases/'), '/cases')

// Slugs are stored decoded - the admin generates them from the title and
// round-trips them through the editor, which decodes on the way in - so a slug
// that is already percent-encoded is not a state this can reach. It is not made
// idempotent deliberately: decoding to "fix" it would throw on a slug containing
// a bare `%`, turning a malformed row into a broken sitemap instead of a wrong URL.

/* ------------------------------------------------- collectSitemapPaths -- */

const paths = (pages: { slug: string; updatedAt?: string }[]) =>
  Array.from(collectSitemapPaths(pages).keys())

// The overlap that matters: these slugs each have a route file in app/ as well as
// a CMS row, so both sources want the same URL.
const overlapping = [
  { slug: 'home' },
  { slug: 'cases' },
  { slug: 'om-os' },
  { slug: 'ydelser' },
  { slug: 'ofte-stillede-spørgsmål' },
]

check(
  'a page that also has a route file is listed once',
  paths(overlapping),
  ['/', '/cases', '/om-os', '/ydelser', '/ofte-stillede-sp%C3%B8rgsm%C3%A5l']
)

check(
  'the encoded and unencoded spellings of the FAQ collide',
  new Set(paths(overlapping)).size,
  paths(overlapping).length
)

// The duplicate slugs collapse to one, and the routes with no page behind them
// are still listed - so '/' appears, filled in by its route file rather than by a
// page. Pages come before routes, which is why '/cases' leads.
check(
  'repeated slugs collapse to one entry',
  paths([{ slug: 'cases' }, { slug: 'cases' }]),
  ['/cases', '/', '/om-os', '/ydelser', '/ofte-stillede-sp%C3%B8rgsm%C3%A5l']
)

check(
  'every route file is listed even with no CMS row behind it',
  paths([]),
  STATIC_PUBLIC_ROUTES.map(slugToPath)
)

check(
  'nested pages survive alongside the routes',
  paths([{ slug: 'ydelser/webshop' }]),
  ['/ydelser/webshop', '/', '/cases', '/om-os', '/ydelser', '/ofte-stillede-sp%C3%B8rgsm%C3%A5l']
)

// A page's own date is worth more than the route file's absence of one, so the
// CMS row has to win the collision rather than being dropped by it.
const dated = collectSitemapPaths([{ slug: 'cases', updatedAt: '2026-01-02T03:04:05Z' }])
check('a page keeps its lastModified through a route collision', dated.get('/cases'), '2026-01-02T03:04:05Z')
check('a route with no page has no date rather than a made-up one', dated.get('/om-os'), undefined)

// Nothing here may contain a raw non-ASCII character, which is the whole point of
// the encoding: an unencoded path is a different URL, not a prettier one.
const allPaths = paths([...overlapping, { slug: 'ydelser/webshop' }, { slug: 'om-os' }])
invariant(
  'no path carries an unencoded non-ASCII character',
  allPaths.every(p => !/[^\x00-\x7F]/.test(p))
)
invariant('no path is listed twice', new Set(allPaths).size === allPaths.length)

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
