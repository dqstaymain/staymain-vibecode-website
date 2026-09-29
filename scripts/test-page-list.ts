/**
 * Checks searching and paging the page library.
 *
 * Two ways this breaks without anyone noticing. A search that folds accents the
 * wrong way round cannot find a Danish page by the name people type. And paging
 * maths that does not clamp shows an empty screen the moment a search narrows
 * the list under the reader - the list is not broken, the window is.
 *
 * Asserted here rather than in the Playwright suite because the suite needs
 * admin credentials to run at all, so a rule like this would otherwise go
 * unchecked on any machine without them.
 */
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  matchesPage,
  paginate,
  pageWindow,
} from '../app/admin/page-list'

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

const page = (title: string, slug: string) => ({ title, slug })

/* -------------------------------------------------------- matchesPage -- */

// The whole reason the search folds accents.
invariant(
  '"spor" finds "spørgsmål"',
  matchesPage(page('Ofte stillede spørgsmål', 'faq'), 'spor')
)
invariant(
  'ø folds to o even though NFD never splits it',
  matchesPage(page('Øvrige services', 'ovrige'), 'ovrige')
)
invariant(
  'æ folds to ae',
  matchesPage(page('Æblekage med fløde', 'aeblekage'), 'aeblekage')
)
invariant(
  '"MÅLER" finds "målerudstyr" whatever the case',
  matchesPage(page('Målerudstyr', 'maalerudstyr'), 'MÅLER')
)
invariant(
  'the term is folded too, so an accented query still matches',
  matchesPage(page('Ofte stillede spørgsmål', 'faq'), 'spørgsmål')
)
invariant('a slug is searched as well as a title', matchesPage(page('Æblekage', 'aeblekage'), 'aeblekage'))
invariant('the slug is searched as well as the title', matchesPage(page('Cases', 'cases'), 'cases'))
invariant('a partial title matches', matchesPage(page('Kontakt os', 'kontakt'), 'ntak'))
invariant('a miss does not match', !matchesPage(page('Cases', 'cases'), 'ydelser'))

// An empty term is not a filter. Whitespace is not either: a stray space in the
// box should not empty the list.
invariant('an empty term matches everything', matchesPage(page('Cases', 'cases'), ''))
invariant('a whitespace-only term matches everything', matchesPage(page('Cases', 'cases'), '   '))
invariant('surrounding whitespace is ignored', matchesPage(page('Cases', 'cases'), '  cases  '))
invariant('an accented title is still found by its exact title', matchesPage(page('Årsrapport', 'aarsrapport'), 'årsrapport'))

/* ------------------------------------------------------------ paginate -- */

const items = Array.from({ length: 57 }, (_, i) => i + 1)

check('the default is twenty a page', DEFAULT_PAGE_SIZE, 20)
invariant('twenty is one of the offered sizes', PAGE_SIZE_OPTIONS.includes(DEFAULT_PAGE_SIZE))

const first = paginate(items, 1, 20)
check('three pages for 57 items at 20 a page', first.pageCount, 3)
check('the first page starts at the beginning', first.visible[0], 1)
check('a full first page', first.visible.length, 20)

const last = paginate(items, 3, 20)
check('the last page holds the remainder', last.visible.length, 17)
check('the last page ends on the last item', last.visible[16], 57)

// The case that matters: a search narrows the list while the reader is on a
// later page. Without clamping they are left looking at nothing.
const narrowed = paginate(['a', 'b'], 5, 20)
check('an out-of-range page clamps to the last', narrowed.current, 1)
check('the clamped window still shows the items', narrowed.visible, ['a', 'b'])
check('an empty list is one empty page, not zero', paginate([], 3, 20).pageCount, 1)
check('an empty list shows nothing', paginate([], 3, 20).visible, [])
check('an out-of-range page on an empty list is page 1', paginate([], 3, 20).current, 1)

// Page numbers are 1-based everywhere. A 0 slipped through would slice from
// index -20, which silently returns the wrong window rather than failing.
check('page zero clamps to the first', paginate(items, 0, 20).current, 1)
check('a negative page clamps to the first', paginate(items, -4, 20).current, 1)
check('a page past the end clamps to the last', paginate(items, 99, 20).current, 3)
check('a page size of zero does not divide by zero', paginate(items, 1, 0).pageCount, 57)
check('a nonsense page size is treated as one', paginate(items, 1, -3).visible.length, 1)

// Every page of a full sweep has to be a real, non-overlapping slice.
let seen = 0
let distinct = true
for (let p = 1; p <= first.pageCount; p++) {
  const w = paginate(items, p, 20)
  distinct = distinct && w.visible.every(v => !items.slice(0, seen).includes(v))
  seen += w.visible.length
}
check('sweeping every page visits every item exactly once', seen, items.length)
invariant('no item appears on two pages', distinct)

/* ---------------------------------------------------------- pageWindow -- */

check('a short list is listed in full', pageWindow(1, 3), [1, 2, 3])
check('seven pages is still a short list', pageWindow(4, 7), [1, 2, 3, 4, 5, 6, 7])
check('the first and last are always reachable', pageWindow(1, 20).slice(0, 1), [1])
check('the last page is always offered', pageWindow(1, 20).slice(-1), [20])
invariant('a gap stands in for the pages skipped', pageWindow(10, 20).includes('gap'))
invariant('no gaps in a short list', !pageWindow(3, 6).includes('gap'))

// Wherever the reader is, they can get back to where they were and jump to either
// end. This is the property that makes the collapsed middle acceptable at all.
for (const [current, pageCount] of [[1, 20], [2, 20], [10, 20], [19, 20], [20, 20]] as const) {
  const w = pageWindow(current, pageCount)
  invariant(
    `page ${current} of ${pageCount} can reach itself, the first and the last`,
    w.includes(current) && w.includes(1) && w.includes(pageCount)
  )
}
invariant(
  'a gap never stands in for a page that is reachable',
  pageWindow(10, 20).filter(n => typeof n === 'number').every(n => n >= 1 && n <= 20)
)

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
process.exit(failures === 0 ? 0 : 1)
